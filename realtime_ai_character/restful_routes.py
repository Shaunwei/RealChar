import asyncio
import datetime
import os
import uuid
from typing import Optional

import firebase_admin
import httpx
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    status as http_status,
    UploadFile,
)
from firebase_admin import auth, credentials
from firebase_admin.exceptions import FirebaseError
from google.cloud import storage
from sqlalchemy import func
from sqlalchemy.orm import Session

from realtime_ai_character.audio.text_to_speech import get_text_to_speech
from realtime_ai_character.database.connection import get_db
from realtime_ai_character.llm.highlight_action_generator import (
    generate_highlight_action,
    generate_highlight_based_on_prompt,
)
from realtime_ai_character.llm.system_prompt_generator import generate_system_prompt
from realtime_ai_character.models.interaction import Interaction
from realtime_ai_character.models.feedback import Feedback, FeedbackRequest
from realtime_ai_character.models.character import (
    Character,
    CharacterRequest,
    EditCharacterRequest,
    DeleteCharacterRequest,
    GenerateHighlightRequest,
    GeneratePromptRequest,
)


router = APIRouter()

if os.getenv("USE_AUTH") == "true":
    cred = credentials.Certificate(os.environ.get("FIREBASE_CONFIG_PATH"))
    firebase_admin.initialize_app(cred)

MAX_FILE_UPLOADS = 5


async def get_current_user(request: Request):
    """Returns the current user if the request is authenticated, otherwise None."""
    if os.getenv("USE_AUTH") == "true" and "Authorization" in request.headers:
        # Extracts the token from the Authorization header
        tokens = request.headers.get("Authorization", "").split("Bearer ")
        if not tokens or len(tokens) < 2:
            raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token = tokens[1]
        try:
            # Verify the token against the Firebase Auth API.
            decoded_token = auth.verify_id_token(token)
        except FirebaseError:
            raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return decoded_token


@router.get("/status")
async def status():
    return {"status": "ok", "message": "RealChar is running smoothly!"}


@router.get("/characters")
async def characters(user=Depends(get_current_user)):
    gcs_path = os.getenv("GCP_STORAGE_URL")
    if not gcs_path:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GCP_STORAGE_URL is not set",
        )

    def get_image_url(character):
        if character.data and "avatar_filename" in character.data:
            return f'{gcs_path}/{character.data["avatar_filename"]}'
        else:
            return f"{gcs_path}/static/realchar/{character.character_id}.jpg"

    uid = user["uid"] if user else None
    from realtime_ai_character.character_catalog.catalog_manager import CatalogManager

    catalog: CatalogManager = CatalogManager.get_instance()
    return [
        {
            "character_id": character.character_id,
            "name": character.name,
            "source": character.source,
            "voice_id": character.voice_id,
            "author_name": character.author_name,
            "audio_url": f"{gcs_path}/static/realchar/{character.character_id}.mp3",
            "image_url": get_image_url(character),
            "tts": character.tts,
            "is_author": character.author_id == uid,
            "location": character.location,
            "rebyte_project_id": character.rebyte_api_project_id,
            "rebyte_agent_id": character.rebyte_api_agent_id,
        }
        for character in sorted(catalog.characters.values(), key=lambda c: c.order)
        if character.author_id == uid or character.visibility == "public"
    ]


@router.get("/configs")
async def configs():
    return {
        "llms": ["gpt-4", "gpt-3.5-turbo-16k", "claude-2", "meta-llama/Llama-2-70b-chat-hf"],
    }


@router.get("/session_history")
async def get_session_history(session_id: str, db: Session = Depends(get_db)):
    # Read session history from the database.
    interactions = await asyncio.to_thread(
        db.query(Interaction).filter(Interaction.session_id == session_id).all
    )
    # return interactions in json format
    interactions_json = [interaction.to_dict() for interaction in interactions]
    return interactions_json


@router.post("/feedback")
async def post_feedback(
    feedback_request: FeedbackRequest, user=Depends(get_current_user), db: Session = Depends(get_db)
):
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    feedback = Feedback(**feedback_request.dict())
    feedback.user_id = user["uid"]
    feedback.created_at = datetime.datetime.now()  # type: ignore
    await asyncio.to_thread(feedback.save, db)


@router.post("/uploadfile")
async def upload_file(file: UploadFile = File(...), user=Depends(get_current_user)):
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    storage_client = storage.Client()
    bucket_name = os.environ.get("GCP_STORAGE_BUCKET_NAME")
    if not bucket_name:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GCP_STORAGE_BUCKET_NAME is not set",
        )

    bucket = storage_client.bucket(bucket_name)

    # Create a new filename with a timestamp and a random uuid to avoid duplicate filenames
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
    new_filename = (
        f"user_upload/{user['uid']}/"
        f"{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}-"
        f"{uuid.uuid4()}{file_extension}"
    )

    blob = bucket.blob(new_filename)

    contents = await file.read()

    await asyncio.to_thread(blob.upload_from_string, contents)

    return {"filename": new_filename, "content-type": file.content_type}


@router.post("/create_character")
async def create_character(
    character_request: CharacterRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    character = Character(**character_request.dict())
    character.id = str(uuid.uuid4().hex)  # type: ignore
    character.background_text = character_request.background_text  # type: ignore
    character.author_id = user["uid"]
    now_time = datetime.datetime.now()
    character.created_at = now_time  # type: ignore
    character.updated_at = now_time  # type: ignore
    await asyncio.to_thread(character.save, db)


@router.post("/edit_character")
async def edit_character(
    edit_character_request: EditCharacterRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    character_id = edit_character_request.id
    character = await asyncio.to_thread(
        db.query(Character).filter(Character.id == character_id).one
    )
    if not character:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Character {character_id} not found",
        )

    if character.author_id != user["uid"]:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized to edit this character",
            headers={"WWW-Authenticate": "Bearer"},
        )
    character = Character(**edit_character_request.dict())
    character.updated_at = datetime.datetime.now()  # type: ignore
    db.merge(character)
    db.commit()


@router.post("/delete_character")
async def delete_character(
    delete_character_request: DeleteCharacterRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    character_id = delete_character_request.character_id
    character = await asyncio.to_thread(
        db.query(Character).filter(Character.id == character_id).one
    )
    if not character:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Character {character_id} not found",
        )

    if character.author_id != user["uid"]:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized to delete this character",
            headers={"WWW-Authenticate": "Bearer"},
        )
    db.delete(character)
    db.commit()


@router.post("/generate_audio")
async def generate_audio(text: str, tts: Optional[str] = None, user=Depends(get_current_user)):
    if not isinstance(text, str) or text == "":
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Text is empty",
        )
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        tts_service = get_text_to_speech(tts)
    except NotImplementedError:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Text to speech engine not found",
        )
    audio_bytes = await tts_service.generate_audio(text)
    # save audio to a file on GCS
    storage_client = storage.Client()
    bucket_name = os.environ.get("GCP_STORAGE_BUCKET_NAME")
    if not bucket_name:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GCP_STORAGE_BUCKET_NAME is not set",
        )
    bucket = storage_client.bucket(bucket_name)

    # Create a new filename with a timestamp and a random uuid to avoid duplicate filenames
    file_extension = ".mp3"
    new_filename = (
        f"user_upload/{user['uid']}/"
        f"{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}-"
        f"{uuid.uuid4()}{file_extension}"
    )

    blob = bucket.blob(new_filename)

    await asyncio.to_thread(blob.upload_from_string, audio_bytes)

    return {"filename": new_filename, "content-type": "audio/mpeg"}


@router.post("/clone_voice")
async def clone_voice(filelist: list[UploadFile] = Form(...), user=Depends(get_current_user)):
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if len(filelist) > MAX_FILE_UPLOADS:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Number of files exceeds the limit ({MAX_FILE_UPLOADS})",
        )

    storage_client = storage.Client()
    bucket_name = os.environ.get("GCP_STORAGE_BUCKET_NAME")
    if not bucket_name:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GCP_STORAGE_BUCKET_NAME is not set",
        )

    bucket = storage_client.bucket(bucket_name)
    voice_request_id = str(uuid.uuid4().hex)

    for file in filelist:
        # Create a new filename with a timestamp and a random uuid to avoid duplicate filenames
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        new_filename = (
            f"user_upload/{user['uid']}/{voice_request_id}/"
            f"{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}-"
            f"{uuid.uuid4()}{file_extension}"
        )

        blob = bucket.blob(new_filename)

        contents = await file.read()

        await asyncio.to_thread(blob.upload_from_string, contents)

    # Construct the data for the API request
    # TODO: support more voice cloning services.
    data = {
        "name": user["uid"] + "_" + voice_request_id,
    }

    files = [("files", (file.filename, file.file)) for file in filelist]

    headers = {
        "xi-api-key": os.getenv("ELEVEN_LABS_API_KEY", ""),
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.elevenlabs.io/v1/voices/add", headers=headers, data=data, files=files
        )

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()


@router.post("/system_prompt")
async def system_prompt(request: GeneratePromptRequest, user=Depends(get_current_user)):
    """Generate System Prompt according to name and background."""
    name = request.name
    background = request.background
    if not isinstance(name, str) or name == "":
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Name is empty",
        )
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"system_prompt": await generate_system_prompt(name, background)}


@router.get("/conversations", response_model=list[dict])
async def get_recent_conversations(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = user["uid"]
    stmt = (
        db.query(
            Interaction.session_id,
            Interaction.client_message_unicode,
            Interaction.timestamp,
            func.row_number()
            .over(partition_by=Interaction.session_id, order_by=Interaction.timestamp.desc())
            .label("rn"),
        )
        .filter(Interaction.user_id == user_id)
        .subquery()
    )

    results = await asyncio.to_thread(
        db.query(stmt.c.session_id, stmt.c.client_message_unicode)
        .filter(stmt.c.rn == 1)
        .order_by(stmt.c.timestamp.desc())
        .all
    )

    # Format the results to the desired output
    return [
        {"session_id": r[0], "client_message_unicode": r[1], "timestamp": r[2]} for r in results
    ]


@router.get("/get_character")
async def get_character(
    character_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)
):
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    character = await asyncio.to_thread(
        db.query(Character).filter(Character.id == character_id).one
    )
    if not character:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=f"Character {character_id} not found",
        )
    if character.author_id != user["uid"]:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized to access this character",
            headers={"WWW-Authenticate": "Bearer"},
        )
    character_json = character.to_dict()
    return character_json


@router.post("/generate_highlight")
async def generate_highlight(
    generate_highlight_request: GenerateHighlightRequest, user=Depends(get_current_user)
):
    # Only allow for authorized user.
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    context = generate_highlight_request.context
    prompt = generate_highlight_request.prompt
    result = ""
    if prompt:
        result = await generate_highlight_based_on_prompt(context, prompt)
    else:
        result = await generate_highlight_action(context)

    return {"highlight": result}

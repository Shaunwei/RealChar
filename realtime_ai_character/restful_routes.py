import os
import datetime
import uuid
import asyncio

from fastapi import APIRouter, Depends, HTTPException, Request, \
    status as http_status, UploadFile, File
from google.cloud import storage
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import firebase_admin
from firebase_admin import auth, credentials
from firebase_admin.exceptions import FirebaseError
from realtime_ai_character.database.connection import get_db
from realtime_ai_character.models.interaction import Interaction
from realtime_ai_character.models.feedback import Feedback, FeedbackRequest
from realtime_ai_character.models.character import Character, CharacterRequest, EditCharacterRequest
from requests import Session


router = APIRouter()

templates = Jinja2Templates(directory=os.path.join(
    os.path.dirname(os.path.abspath(__file__)), 'static'))

if os.getenv('USE_AUTH', ''):
    cred = credentials.Certificate(os.environ.get('FIREBASE_CONFIG_PATH'))
    firebase_admin.initialize_app(cred)


async def get_current_user(request: Request):
    """Heler function for auth with Firebase."""
    if os.getenv('USE_AUTH', ''):
        # Extracts the token from the Authorization header
        if 'Authorization' not in request.headers:
            # Anonymous users.
            return ""
        tokens = request.headers.get('Authorization').split("Bearer ")
        if not tokens or len(tokens) < 2:
            raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail='Invalid authentication credentials',
                headers={'WWW-Authenticate': 'Bearer'},
            )
        token = tokens[1]
        try:
            # Verify the token against the Firebase Auth API.
            decoded_token = auth.verify_id_token(token)
        except FirebaseError:
            raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail='Invalid authentication credentials',
                headers={'WWW-Authenticate': 'Bearer'},
            )

        return decoded_token
    else:
        return ""


@router.get("/status")
async def status():
    return {"status": "ok", "message": "RealChar is running smoothly!"}


@router.get("/", response_class=HTMLResponse)
async def index(request: Request, user=Depends(get_current_user)):
    return templates.TemplateResponse("index.html", {"request": request})


@router.get("/characters")
async def characters(user=Depends(get_current_user)):
    uid = user['uid'] if user else None
    from realtime_ai_character.character_catalog.catalog_manager import CatalogManager
    catalog: CatalogManager = CatalogManager.get_instance()
    return [{
        "character_id": character.character_id,
        "name": character.name,
        "source": character.source,
        "voice_id": character.voice_id,
        "author_name": character.author_name,
        "image_url":
        f'https://storage.googleapis.com/assistly/static/realchar/{character.character_id}.jpg',
        "avatar_id": character.avatar_id,
        "tts": character.tts,
    } for character in catalog.characters.values()
            if character.author_id == uid or character.visibility == 'public']


@router.get("/configs")
async def configs():
    return {
        'llms': ['gpt-4', 'gpt-3.5-turbo-16k', 'claude-2', 'meta-llama/Llama-2-70b-chat-hf'],
    }

@router.get("/session_history")
async def get_session_history(session_id: str, db: Session = Depends(get_db)):
    # Read session history from the database.
    interactions = db.query(Interaction).filter(Interaction.session_id == session_id).all()
    # return interactions in json format
    interactions_json = [interaction.to_dict() for interaction in interactions]
    return interactions_json

@router.post("/feedback")
async def post_feedback(feedback_request: FeedbackRequest,
                        user = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail='Invalid authentication credentials',
                headers={'WWW-Authenticate': 'Bearer'},
            )
    feedback = Feedback(**feedback_request.dict())
    feedback.user_id = user['uid']
    feedback.created_at = datetime.datetime.now()
    feedback.save(db)


@router.post("/uploadfile")
async def upload_file(file: UploadFile = File(...), user = Depends(get_current_user)):
    if not user:
        raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail='Invalid authentication credentials',
                headers={'WWW-Authenticate': 'Bearer'},
            )

    storage_client = storage.Client()
    bucket_name = os.environ.get('GCP_STORAGE_BUCKET_NAME')
    if not bucket_name:
        raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail='GCP_STORAGE_BUCKET_NAME is not set',
            )

    bucket = storage_client.bucket(bucket_name)

    # Create a new filename with a timestamp and a random uuid to avoid duplicate filenames
    file_extension = os.path.splitext(file.filename)[1]
    new_filename = (
        f"user_upload/{user['uid']}/"
        f"{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}-"
        f"{uuid.uuid4()}{file_extension}"
    )

    blob = bucket.blob(new_filename)

    contents = await file.read()

    await asyncio.to_thread(blob.upload_from_string, contents)

    return {
        "filename": new_filename,
        "content-type": file.content_type
    }

@router.post("/create_character")
async def create_character(character_request: CharacterRequest,
                           user = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail='Invalid authentication credentials',
                headers={'WWW-Authenticate': 'Bearer'},
            )
    character = Character(**character_request.dict())
    character.id = str(uuid.uuid4().hex)
    character.author_id = user['uid']
    now_time = datetime.datetime.now()
    character.created_at = now_time
    character.updated_at = now_time
    character.save(db)


@router.post("/edit_character")
async def edit_character(edit_character_request: EditCharacterRequest,
                         user = Depends(get_current_user),
                         db: Session = Depends(get_db)):
    if not user:
        raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail='Invalid authentication credentials',
                headers={'WWW-Authenticate': 'Bearer'},
            )
    character_id = edit_character_request.id
    characters = db.query(Character).filter(Character.id == character_id).all()
    if len(characters) == 0:
        raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail=f'Character {character_id} not found',
            )

    character = characters[0]
    if character.author_id != user['uid']:
        raise HTTPException(
                status_code=http_status.HTTP_401_UNAUTHORIZED,
                detail='Invalid authentication credentials',
                headers={'WWW-Authenticate': 'Bearer'},
            )
    character = Character(**edit_character_request.dict())
    character.updated_at = datetime.datetime.now()
    db.merge(character)
    db.commit()

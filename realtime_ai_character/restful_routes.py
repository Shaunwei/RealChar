import os

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import firebase_admin
from firebase_admin import auth, credentials
from firebase_admin.exceptions import FirebaseError
from realtime_ai_character.database.connection import get_db
from realtime_ai_character.models.interaction import Interaction
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
        token = request.headers.get('Authorization').split("Bearer ")[1]
        try:
            # Verify the token against the Firebase Auth API.
            decoded_token = auth.verify_id_token(token)
        except FirebaseError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
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
async def characters():
    from realtime_ai_character.character_catalog.catalog_manager import CatalogManager
    catalog: CatalogManager = CatalogManager.get_instance()
    return [
        {
            "character_id": character.character_id,
            "name": character.name,
            "source": character.source,
            "voice_id": character.voice_id,
            "author_name": character.author_name,
            "image_url": f'https://storage.googleapis.com/assistly/static/realchar/{character.character_id}.jpg',
            "avatar_id": character.avatar_id,
        } for character in catalog.characters.values()
    ]


@router.get("/configs")
async def configs():
    return {
        'llms': ['gpt-4', 'gpt-3.5-turbo-16k', 'claude-2']
    }

@router.get("/session_history")
async def get_session_history(session_id: str, db: Session = Depends(get_db)):
    # Read session history from the database.
    interactions = db.query(Interaction).filter(Interaction.session_id == session_id).all()
    # return interactions in json format
    interactions_json = [interaction.to_dict() for interaction in interactions]
    return interactions_json

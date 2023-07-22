import os

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import firebase_admin
from firebase_admin import auth, credentials
from firebase_admin.exceptions import FirebaseError


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
    return {"status": "ok"}


@router.get("/", response_class=HTMLResponse)
async def index(request: Request, user=Depends(get_current_user)):
    return templates.TemplateResponse("index.html", {"request": request})

from fastapi import APIRouter

router = APIRouter()


@router.get("/ping")
async def ping():
    return {"ping": "pong!"}


@router.get("/status")
async def status():
    return {"status": "ok"}

from pydantic import BaseModel


class MakeTwilioOutgoingCallRequest(BaseModel):
    source_number: str | None = None
    target_number: str
    character_id: str | None = None
    vad_threshold: float = 0.8

from pydantic import BaseModel


class MakeTwilioOutgoingCallRequest(BaseModel):
    source_number: str | None = None
    target_number: str

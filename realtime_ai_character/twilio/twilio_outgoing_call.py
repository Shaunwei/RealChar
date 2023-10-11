from pydantic import BaseModel


class MakeTwilioOutgoingCallRequest(BaseModel):
    source_number: str
    target_number: str

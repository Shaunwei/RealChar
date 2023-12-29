import datetime
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import Column, DateTime, String, Unicode
from sqlalchemy.inspection import inspect

from realtime_ai_character.database.base import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    message_id = Column(String(64), primary_key=True)
    session_id = Column(String(50), nullable=True)
    user_id = Column(String(50), nullable=True)
    server_message_unicode = Column(Unicode(65535), nullable=True)
    feedback = Column(String(100), nullable=True)
    comment = Column(Unicode(65535), nullable=True)
    created_at = Column(DateTime(), nullable=False)

    def to_dict(self):
        return {
            c.key: getattr(self, c.key).isoformat()
            if isinstance(getattr(self, c.key), datetime.datetime)
            else getattr(self, c.key)
            for c in inspect(self).mapper.column_attrs
        }

    def save(self, db):
        db.add(self)
        db.commit()


class FeedbackRequest(BaseModel):
    message_id: str
    session_id: Optional[str] = None
    server_message_unicode: Optional[str] = None
    feedback: Optional[str] = None
    comment: Optional[str] = None

import datetime

from pydantic import BaseModel
from realtime_ai_character.database.base import Base
from sqlalchemy import Column, String, DateTime, Unicode
from sqlalchemy.inspection import inspect
from typing import Optional


class Memory(Base):
    __tablename__ = "memory"

    memory_id = Column(String(64), primary_key=True)
    user_id = Column(String(50), nullable=True)
    source_session_id = Column(String(50), nullable=True)
    content = Column(Unicode(65535), nullable=True)
    created_at = Column(DateTime(), nullable=False)
    updated_at = Column(DateTime(), nullable=False)

    def to_dict(self):
        return {
            c.key:
            getattr(self, c.key).isoformat() if isinstance(
                getattr(self, c.key), datetime.datetime) else getattr(
                    self, c.key)
            for c in inspect(self).mapper.column_attrs
        }

    def save(self, db):
        db.add(self)
        db.commit()


class EditMemoryRequest(BaseModel):
    memory_id: str
    source_session_id: Optional[str] = None
    content: Optional[str] = None

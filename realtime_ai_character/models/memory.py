import datetime
import os
from typing import Optional

from pgvector.sqlalchemy import Vector
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, String, Unicode
from sqlalchemy.inspection import inspect

from realtime_ai_character.database.base import Base


class Memory(Base):
    __tablename__ = "memory"

    memory_id = Column(String(64), primary_key=True)
    user_id = Column(String(50), nullable=True)
    source_session_id = Column(String(50), nullable=True)
    content = Column(Unicode(65535), nullable=True)
    created_at = Column(DateTime(), nullable=False)
    updated_at = Column(DateTime(), nullable=False)
    if "postgres" in os.environ.get("DATABASE_URL", ""):
        content_embedding = Column(Vector(1536), nullable=True)

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


class EditMemoryRequest(BaseModel):
    memory_id: str
    source_session_id: Optional[str] = None
    content: Optional[str] = None

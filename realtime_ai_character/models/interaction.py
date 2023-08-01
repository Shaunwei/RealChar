from sqlalchemy import Column, Integer, String, DateTime, Unicode
from sqlalchemy.inspection import inspect
import datetime
from realtime_ai_character.database.base import Base


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True, nullable=False)
    client_id = Column(Integer)  # deprecated, use user_id instead
    user_id = Column(String(50))
    session_id = Column(String(50))
    # deprecated, use client_message_unicode instead
    client_message = Column(String)
    # deprecated, use server_message_unicode instead
    server_message = Column(String)
    client_message_unicode = Column(Unicode(65535))
    server_message_unicode = Column(Unicode(65535))

    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    platform = Column(String(50))
    action_type = Column(String(50))
    character_id = Column(String(100))
    tools = Column(String(100))
    language = Column(String(10))

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

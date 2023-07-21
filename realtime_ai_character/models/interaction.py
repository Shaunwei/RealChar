from sqlalchemy import Column, Integer, String, DateTime, Unicode
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

    def save(self, db):
        db.add(self)
        db.commit()

from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.inspection import inspect
import datetime
from realtime_ai_character.database.base import Base


class Character(Base):
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True, nullable=False)
    name = Column(String(1024), nullable=False)
    system_prompt = Column(String(262144), nullable=True)
    user_prompt = Column(String(262144), nullable=True)
    text_to_speech_use = Column(String(100), nullable=True)
    voice_id = Column(String(100), nullable=True)
    author_id = Column(String(100), nullable=True)
    visibility = Column(String(100), nullable=True)
    data = Column(JSON(), nullable=True)
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

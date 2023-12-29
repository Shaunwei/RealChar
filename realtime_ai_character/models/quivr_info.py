from typing import Optional

from pydantic import BaseModel
from sqlalchemy import Column, Integer, String

from realtime_ai_character.database.base import Base


class QuivrInfo(Base):
    __tablename__ = "quivr_info"

    id = Column(Integer, primary_key=True)
    user_id = Column(String(50))
    quivr_api_key = Column(String)
    quivr_brain_id = Column(String)

    def save(self, db):
        db.add(self)
        db.commit()


class UpdateQuivrInfoRequest(BaseModel):
    quivr_api_key: Optional[str] = None
    quivr_brain_id: Optional[str] = None

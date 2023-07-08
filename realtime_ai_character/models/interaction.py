from sqlalchemy import Column, Integer, String, DateTime
import datetime
from realtime_ai_character.database.base import Base


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True, nullable=False)
    client_id = Column(Integer)
    client_message = Column(String)
    server_message = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    def save(self, db):
        db.add(self)
        db.commit()

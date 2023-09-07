from sqlalchemy import Column, String
from sqlalchemy.inspection import inspect
import datetime
from realtime_ai_character.database.base import Base


class Guest(Base):
    __tablename__ = "guests_test"

    name = Column(String, primary_key=True)
    number = Column(String)


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

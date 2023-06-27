from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from dotenv import load_dotenv
import os

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

session_local = scoped_session(sessionmaker(
    autocommit=False, autoflush=False, bind=engine))

if __name__ == "__main__":
    print(SQLALCHEMY_DATABASE_URL)

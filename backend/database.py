from sqlmodel import create_engine, SQLModel, Session
import os

# ב-Docker אנחנו נשתמש בכתובת של הקונטיינר של ה-DB
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./soc_data.db")

engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
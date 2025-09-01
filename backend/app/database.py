import os
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load .env file from backend folder
env_path = Path(__file__).resolve().parent.parent / '.env'
print(f"Looking for .env at: {env_path}")
if not env_path.exists():
    raise FileNotFoundError(f".env file not found at {env_path}")
load_dotenv(env_path)
print(f".env loaded successfully: {load_dotenv(env_path)}")  # Should print True

DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

print(f"DATABASE_URL loaded: {DATABASE_URL}")  # Debug print
print(f"JWT_SECRET_KEY loaded: {JWT_SECRET_KEY}")  # Debug print

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY not found in .env file")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, tenant, user, task
from app.routers.websocket import router as websocket_router # Corrected import statement
from pathlib import Path

app = FastAPI()

# CORS Configuration
origins = [
    "http://127.0.0.1:5500",  # Frontend Live Server
    "http://localhost:5500",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# frontend folder ka sahi path banayein
BASE_DIR = Path(__file__).resolve().parent.parent.parent
frontend_dir = BASE_DIR / "frontend"

# Static files ko serve karne ke liye naya mount
app.mount("/frontend", StaticFiles(directory=frontend_dir), name="frontend")

app.include_router(auth.router)
app.include_router(tenant.router)
app.include_router(user.router)
app.include_router(task.router)
app.include_router(websocket_router)
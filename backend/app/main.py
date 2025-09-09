# backend/app/main.py
import os
from dotenv import load_dotenv

# Load environment variables from the .env file at the very beginning
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Form, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, get_db
from . import models
from . import schemas
from .routers import auth, task, tenant, user, websocket

app = FastAPI(title="TaskFlow API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth.router)
app.include_router(task.router)
app.include_router(tenant.router)
app.include_router(user.router)
app.include_router(websocket.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the TaskFlow API"}


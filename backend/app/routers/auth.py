# app/routers/auth.py

import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas import UserCreate, UserLogin, UserOut
from app.models import User, Tenant
from app.database import get_db
from bcrypt import hashpw, gensalt, checkpw
from jose import jwt
from datetime import datetime, timedelta
from typing import Dict

router = APIRouter(prefix="/auth", tags=["auth"])

# JWT secret key ko environment se load karein
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment mein set nahi hai")

def create_access_token(data: dict):
    """JWT token banata hai."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=60)  # Token ko 60 minutes ke liye valid rakhein
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm="HS256")
    return encoded_jwt

# --------- SIGNUP ----------
@router.post("/signup", response_model=Dict)  # Yahan badlaav kiya gaya hai
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """
    Naye team aur pehle user ko signup karein.
    """
    existing_tenant = db.query(Tenant).filter(Tenant.name == user.tenant_name).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team name pehle se registerd hai"
        )

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email pehle se registerd hai"
        )

    # Naya tenant banayein
    new_tenant = Tenant(name=user.tenant_name)
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    # Naya user banayein aur usko naye tenant se jodein
    hashed_password = hashpw(user.password.encode("utf-8"), gensalt())
    new_user = User(
        email=user.email,
        hashed_password=hashed_password.decode("utf-8"),
        tenant_id=new_tenant.id,
        role="admin"  # Signup karne wala pehla user admin hota hai
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # JWT token banayein
    access_token = create_access_token(data={"sub": str(new_user.id)})

    # User data aur token dono return karein
    return {
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "tenant_id": new_user.tenant_id,
            "role": new_user.role,
        },
        "access_token": access_token,
        "token_type": "bearer",
    }

# --------- LOGIN ----------
@router.post("/login")
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """
    User ko login karein aur JWT token return karein.
    """
    user = db.query(User).filter(User.email == user_login.email).first()

    # Agar user exist nahi karta ya password match nahi hota
    if not user or not checkpw(
        user_login.password.encode("utf-8"), user.hashed_password.encode("utf-8")
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # JWT token banayein
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}
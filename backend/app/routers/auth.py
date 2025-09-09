# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.database import get_db
from bcrypt import hashpw, gensalt, checkpw
from typing import Dict

# --- Import the new centralized function ---
from app.dependencies import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=Dict)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_tenant = db.query(Tenant).filter(Tenant.name == user.tenant_name).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    new_tenant = Tenant(name=user.tenant_name)
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    hashed_password = hashpw(user.password.encode("utf-8"), gensalt())
    new_user = User(
        email=user.email,
        hashed_password=hashed_password.decode("utf-8"),
        tenant_id=new_tenant.id,
        role=UserRole.admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Use the centralized function to create the token
    access_token = create_access_token(data={"sub": str(new_user.id)})
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

@router.post("/login")
def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_login.email).first()
    if not user or not checkpw(user_login.password.encode("utf-8"), user.hashed_password.encode("utf-8")):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}
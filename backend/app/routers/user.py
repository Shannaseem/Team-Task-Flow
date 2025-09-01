# app/routers/user.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.dependencies import get_current_user
from app.database import get_db
from app.schemas.user import UserOut, UserInvite
from app.models.user import User
from app.models.tenant import Tenant # Tenant model ko import karein
from bcrypt import hashpw, gensalt

router = APIRouter(prefix="/users", tags=["users"])

# Current user ki details return karne ke liye route
@router.get("/me", response_model=UserOut)
def read_current_user(current_user: UserOut = Depends(get_current_user)):
    """
    Current logged-in user ki details return karein.
    """
    return current_user

# Ek tenant (team) ke sabhi users ko return karein
@router.get("/", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db), current_user: UserOut = Depends(get_current_user)):
    """
    Current user ke tenant ke sabhi users ko return karein.
    """
    users = db.query(User).filter(User.tenant_id == current_user.tenant_id).all()
    return users

# Naye user ko invite karein
@router.post("/invite", response_model=UserOut)
def invite_user(
    user_invite: UserInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Naye user ko tenant mein invite karein.
    Sirf admin hi users ko invite kar sakte hain.
    """
    # Check karein ki current user admin hai ya nahi
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sirf admin hi naye users ko invite kar sakte hain."
        )

    # Check karein ki email pehle se registerd hai ya nahi
    existing_user = db.query(User).filter(User.email == user_invite.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email pehle se registerd hai"
        )
    
    # Naya user banayein
    hashed_password = hashpw(user_invite.password.encode("utf-8"), gensalt())
    
    new_user = User(
        email=user_invite.email,
        hashed_password=hashed_password.decode("utf-8"),
        tenant_id=current_user.tenant_id,
        role=user_invite.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserOut.from_orm(new_user)

# Naye endpoint: Member ko remove karne ke liye
@router.delete("/remove_user/{user_id}", status_code=status.HTTP_200_OK)
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """
    Ek user ko team se remove karein. Sirf admin hi user ko remove kar sakte hain.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sirf admin hi users ko remove kar sakte hain."
        )

    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aap khud ko remove nahi kar sakte."
        )

    user_to_remove = db.query(User).filter(User.id == user_id, User.tenant_id == current_user.tenant_id).first()
    if not user_to_remove:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in this team."
        )

    # Aakhri user ko remove hone se rokein
    total_members = db.query(User).filter(User.tenant_id == current_user.tenant_id).count()
    if total_members <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team mein kam se kam ek user hona zaroori hai."
        )

    db.delete(user_to_remove)
    db.commit()
    return {"message": "User successfully removed."}
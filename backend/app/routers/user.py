# backend/app/routers/user.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from app.schemas.user import UserOut, UserInvite
from app.models.user import User as UserModel, UserRole
from app.database import get_db
from app.dependencies import get_current_user
from bcrypt import hashpw, gensalt
from app.routers.websocket import manager
from app.models.task import Task as TaskModel
import secrets

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/invite", response_model=UserOut)
async def invite_user(
    user: UserInvite,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Naye user ko team mein invite karein. Sirf admin kar sakta hai.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can invite users"
        )

    existing_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Generate a random password if not provided
    password = user.password or secrets.token_urlsafe(12)
    hashed_password = hashpw(password.encode("utf-8"), gensalt())
    new_user = UserModel(
        email=user.email,
        hashed_password=hashed_password.decode("utf-8"),
        tenant_id=current_user.tenant_id,
        role=user.role or UserRole.member,  # Default to 'member' if not provided
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        await manager.broadcast(
            str(current_user.tenant_id),
            {"type": "new_member", "data": UserOut.from_orm(new_user).model_dump()}
        )
        return UserOut.from_orm(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to invite user: {str(e)}"
        )

@router.get("/me", response_model=UserOut)
def get_current_user_info(current_user: UserModel = Depends(get_current_user)):
    """
    Current user ki info retrieve karein.
    """
    return UserOut.from_orm(current_user)

@router.get("/", response_model=Dict[str, List[UserOut]])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Current tenant ke sabhi users ko fetch karein.
    """
    try:
        members = db.query(UserModel).filter(UserModel.tenant_id == current_user.tenant_id).all()
        members_out = [UserOut.from_orm(member) for member in members]
        return {"members": members_out}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )

@router.delete("/remove/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Team se ek user ko remove karein. Sirf admin kar sakta hai.
    Tasks ko unassigned kar diya jayega.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can remove users"
        )

    user_to_remove = db.query(UserModel).filter(
        UserModel.id == user_id, UserModel.tenant_id == current_user.tenant_id
    ).first()

    if not user_to_remove:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found in this team")

    if user_to_remove.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot remove themselves"
        )

    try:
        # Unassign tasks
        db.query(TaskModel).filter(TaskModel.assigned_user_id == user_id).update(
            {"assigned_user_id": None}
        )
        db.delete(user_to_remove)
        db.commit()
        await manager.broadcast(
            str(current_user.tenant_id),
            {"type": "member_removed", "data": {"id": user_id}}
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove user: {str(e)}"
        )
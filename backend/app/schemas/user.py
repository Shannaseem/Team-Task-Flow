# app/schemas/user.py

from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    member = "member"

class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.member

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    tenant_name: str

class UserInvite(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    tenant_id: int
    
    class Config:
        from_attributes = True
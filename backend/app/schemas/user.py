from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    tenant_name: str

class UserLogin(UserBase):
    password: str

class UserInvite(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    role: Optional[UserRole] = UserRole.member

class UserOut(UserBase):
    id: int
    tenant_id: int
    role: UserRole

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
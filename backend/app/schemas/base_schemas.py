# backend/app/schemas/base_schemas.py

from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

# --------- User Schemas ---------
# UserLogin is kept here as it is a common model for authentication
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --------- Tenant Schemas ---------
class TenantBase(BaseModel):
    name: str

class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    theme: Optional[str] = None

class TenantOut(TenantBase):
    id: int
    theme: Optional[str] = "light"
    
    class Config:
        from_attributes = True

# --------- Task Schemas ---------
class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"

class TaskCreate(TaskBase):
    assigned_user_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    assigned_user_id: Optional[int] = None
    completed: Optional[bool] = None

class Task(TaskBase):
    id: int
    user_id: int
    tenant_id: int
    completed: bool = False

    class Config:
        from_attributes = True
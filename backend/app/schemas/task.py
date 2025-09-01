# app/schemas/task.py

from pydantic import BaseModel
from typing import Optional
from enum import Enum

class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo" # Yahan par "str" type use karein
    assigned_user_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None # Ye line update hui hai
    assigned_user_id: Optional[int] = None
    completed: Optional[bool] = None

class Task(TaskBase):
    id: int
    user_id: int
    tenant_id: int
    completed: bool = False

    class Config:
        from_attributes = True
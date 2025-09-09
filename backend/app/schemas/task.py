# backend/app/schemas/task.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import enum

class TaskStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"

class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.todo
    assigned_user_id: Optional[int] = None
    due_date: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.medium

class TaskCreate(TaskBase):
    pass

class TaskUpdate(TaskBase):
    title: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None

class Task(TaskBase):
    id: int
    user_id: int # Creator's ID
    tenant_id: int

    class Config:
        from_attributes = True
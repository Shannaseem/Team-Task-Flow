# backend/app/models/task.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from app.schemas.task import TaskStatus, TaskPriority
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True)
    description = Column(String(500), nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.todo)
    completed = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    due_date = Column(DateTime, nullable=True)
    priority = Column(Enum(TaskPriority), default=TaskPriority.medium)

    creator = relationship("User", foreign_keys=[user_id], back_populates="tasks_created")
    assignee = relationship("User", foreign_keys=[assigned_user_id], back_populates="tasks_assigned")
    tenant = relationship("Tenant", back_populates="tasks")
# app/models/task.py

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    status = Column(String, default="todo") # Yahan String hi sahi hai
    completed = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    assigned_user_id = Column(Integer, ForeignKey("users.id"))
    tenant_id = Column(Integer, ForeignKey("tenants.id"))

    user = relationship("User", back_populates="tasks", foreign_keys=[user_id])
    assigned_user = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_user_id])
    tenant = relationship("Tenant", back_populates="tasks")
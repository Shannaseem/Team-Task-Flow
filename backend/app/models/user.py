# app/models/user.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    role = Column(String, default="member")

    tenant = relationship("Tenant", back_populates="users")
    # Fix: Explicitly define the foreign key for 'tasks'
    tasks = relationship("Task", back_populates="user", foreign_keys='[Task.user_id]')
    assigned_tasks = relationship("Task", back_populates="assigned_user", foreign_keys='[Task.assigned_user_id]')
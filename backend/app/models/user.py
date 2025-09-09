# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    member = "member"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    role = Column(Enum(UserRole), default=UserRole.member)

    tenant = relationship("Tenant", back_populates="users")
    tasks_created = relationship("Task", foreign_keys="Task.user_id", back_populates="creator")
    tasks_assigned = relationship("Task", foreign_keys="Task.assigned_user_id", back_populates="assignee")
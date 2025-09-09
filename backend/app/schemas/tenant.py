# backend/app/schemas/tenant.py

from pydantic import BaseModel
from typing import Optional

class TenantBase(BaseModel):
    name: str

class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    name: str

class TenantOut(TenantBase):
    id: int

    class Config:
        from_attributes = True
from pydantic import BaseModel
from typing import Optional

class TenantBase(BaseModel):
    name: str

class TenantCreate(TenantBase):
    pass

class TenantUpdate(BaseModel):
    name: Optional[str] = None

class TenantOut(TenantBase):
    id: int

    class Config:
        from_attributes = True
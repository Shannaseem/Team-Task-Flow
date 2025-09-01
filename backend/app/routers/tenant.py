# app/routers/tenant.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import Tenant, User
from app.schemas.tenant import TenantUpdate, TenantOut
from app.database import get_db
from app.dependencies import get_current_user

router = APIRouter(prefix="/tenants", tags=["tenants"])

@router.get("/me", response_model=TenantOut)
def get_tenant_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Current user ke tenant (team) ki details return karein.
    """
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    return tenant

@router.put("/me", response_model=TenantOut)
def update_tenant(
    tenant_update: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Current user ke tenant (team) ka naam update karein.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sirf admins hi tenant settings update kar sakte hain"
        )

    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    update_data = tenant_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)
    
    db.commit()
    db.refresh(tenant)
    return tenant
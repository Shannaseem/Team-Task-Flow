# backend/app/routers/tenant.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.tenant import TenantCreate, TenantOut, TenantUpdate
from app.models.tenant import Tenant as TenantModel
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User as UserModel # Import UserModel to ensure admin check

router = APIRouter(prefix="/tenants", tags=["tenants"])

@router.post("/", response_model=TenantOut)
def create_tenant(tenant: TenantCreate, db: Session = Depends(get_db)):
    db_tenant = TenantModel(name=tenant.name)
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

@router.get("/me", response_model=TenantOut)
def get_my_tenant(
    db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)
):
    tenant = db.query(TenantModel).filter(TenantModel.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.put("/me", response_model=TenantOut)
def update_tenant_name(
    tenant_update: TenantUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Current team ka naam update karein. Sirf admin kar sakta hai.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can update team settings"
        )

    tenant = db.query(TenantModel).filter(TenantModel.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    tenant.name = tenant_update.name
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant
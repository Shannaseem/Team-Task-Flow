from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models import Task, User
from app.schemas.task import TaskCreate, TaskUpdate, Task as TaskSchema, TaskStatus
from app.database import get_db
from app.dependencies import get_current_user
from typing import List

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=TaskSchema)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Naya task banayein.
    """
    db_task = Task(
        title=task.title,
        description=task.description,
        status=task.status,
        user_id=current_user.id,
        assigned_user_id=task.assigned_user_id,
        tenant_id=current_user.tenant_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/", response_model=List[TaskSchema])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tenant ke liye sabhi tasks return karein.
    """
    return db.query(Task).filter(Task.tenant_id == current_user.tenant_id).all()

@router.get("/{task_id}", response_model=TaskSchema)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ek task ki details return karein.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or task.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task

@router.put("/{task_id}", response_model=TaskSchema)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ek task ko update karein.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if task.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aap is task ko update nahi kar sakte"
        )

    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ek task ko delete karein.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or task.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    db.delete(task)
    db.commit()
    return {"message": "Task successfully deleted"}
    
@router.post("/update_status/{task_id}/{status_value}", response_model=TaskSchema)
def update_task_status(
    task_id: int,
    status_value: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ek task ka status update karein.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task or task.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or you don't have permission"
        )
    
    if status_value not in ["todo", "in_progress", "done"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status value"
        )

    task.status = status_value
    db.commit()
    db.refresh(task)
    return task
# app/routers/task.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional # Add Optional for the new endpoint
from app.schemas.task import TaskCreate, TaskUpdate, Task
from app.models.task import Task as TaskModel
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.routers.websocket import manager

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/", response_model=List[Task]) # New GET endpoint
def get_tasks_for_tenant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    is_my_tasks: Optional[bool] = False,
):
    """
    Sabhi tasks ya user ko assigned tasks retrieve karein.
    """
    query = db.query(TaskModel).filter(TaskModel.tenant_id == current_user.tenant_id)
    if is_my_tasks:
        query = query.filter(TaskModel.assigned_user_id == current_user.id)
    
    tasks = query.all()

    return tasks

@router.post("/", response_model=Task)
async def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Naya task banayein.
    """
    new_task = TaskModel(
        title=task.title,
        description=task.description,
        status=task.status,
        user_id=current_user.id,
        assigned_user_id=task.assigned_user_id,
        tenant_id=current_user.tenant_id,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Task creation ko broadcast karein
    task_data = {
        "id": new_task.id,
        "title": new_task.title,
        "description": new_task.description,
        "status": new_task.status,
        "user_id": new_task.user_id,
        "assigned_user_id": new_task.assigned_user_id,
        "tenant_id": new_task.tenant_id,
        "type": "task_create",
    }
    await manager.broadcast(str(new_task.tenant_id), {"type": "task_create", "data": task_data})

    return new_task

@router.get("/{task_id}", response_model=Task)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ek task ID se task retrieve karein.
    """
    task = db.query(TaskModel).filter(
        TaskModel.id == task_id, TaskModel.tenant_id == current_user.tenant_id
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=Task)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ek existing task ko update karein.
    """
    task = db.query(TaskModel).filter(
        TaskModel.id == task_id, TaskModel.tenant_id == current_user.tenant_id
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)

    # Task update ko broadcast karein
    task_data = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "user_id": task.user_id,
        "assigned_user_id": task.assigned_user_id,
        "tenant_id": task.tenant_id,
        "type": "task_update",
    }
    await manager.broadcast(str(task.tenant_id), {"type": "task_update", "data": task_data})

    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ek task ko delete karein.
    """
    task = db.query(TaskModel).filter(
        TaskModel.id == task_id, TaskModel.tenant_id == current_user.tenant_id
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()

    # Task deletion ko broadcast karein
    await manager.broadcast(str(task.tenant_id), {"type": "task_delete", "data": {"id": task_id}})

    return
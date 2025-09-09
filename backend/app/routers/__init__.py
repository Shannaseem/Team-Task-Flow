# backend/app/routers/__init__.py
from .auth import router as auth_router
from .tenant import router as tenant_router
from .user import router as user_router
from .task import router as task_router
from .websocket import router as websocket_router
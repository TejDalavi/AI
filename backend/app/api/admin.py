from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Annotated
from backend.app.infrastructure.database import get_session
from backend.app.domain.models import LLMConfig, LLMProvider, User, UserRole, UserStatus
from backend.app.api.auth import get_admin_user
from pydantic import BaseModel, ConfigDict
from backend.app.api.schemas import LLMConfigRead, UserRead

router = APIRouter()

class UserApprovalUpdate(BaseModel):
    user_id: int
    status: UserStatus
    role: UserRole

class LLMConfigCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    provider: LLMProvider
    model: str
    api_key: str = ""
    temperature: float = 0.7
    max_tokens: int = 2000

def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "full_name": user.full_name,
        "mobile": user.mobile,
        "bio": user.bio,
        "created_at": user.created_at,
    }


def serialize_llm_config(config: LLMConfig) -> dict:
    provider_name = config.provider.value if isinstance(config.provider, LLMProvider) else str(config.provider)
    return {
        "id": config.id,
        "provider": provider_name,
        "model": config.model,
        "temperature": config.temperature,
        "max_tokens": config.max_tokens,
        "is_active": config.is_active,
        "updated_at": config.updated_at,
        "has_api_key": bool(config.api_key),
    }


@router.get("/users", response_model=List[UserRead])
def list_users(session: Session = Depends(get_session), admin: User = Depends(get_admin_user)):
    _ = admin
    users = session.exec(select(User)).all()
    return [serialize_user(user) for user in users]

@router.post("/users/approve", response_model=UserRead)
def approve_user(approval_in: UserApprovalUpdate, session: Session = Depends(get_session), admin: User = Depends(get_admin_user)):
    _ = admin
    user = session.get(User, approval_in.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = approval_in.status
    user.role = approval_in.role
    session.add(user)
    session.commit()
    session.refresh(user)
    return serialize_user(user)

@router.post("/llm-config", response_model=LLMConfigRead)
def update_llm_config(config_in: LLMConfigCreate, session: Session = Depends(get_session), admin: User = Depends(get_admin_user)):
    _ = admin
    # Deactivate current active config
    active_configs = session.exec(select(LLMConfig).where(LLMConfig.is_active == True)).all()
    previous_active = active_configs[0] if active_configs else None
    for active_config in active_configs:
        active_config.is_active = False
        session.add(active_config)

    api_key = config_in.api_key.strip()
    if not api_key and previous_active and previous_active.provider == config_in.provider:
        api_key = previous_active.api_key

    new_config = LLMConfig(
        provider=config_in.provider,
        model=config_in.model,
        api_key=api_key,
        temperature=config_in.temperature,
        max_tokens=config_in.max_tokens,
        is_active=True
    )
    session.add(new_config)
    session.commit()
    session.refresh(new_config)
    return serialize_llm_config(new_config)

@router.get("/llm-config", response_model=List[LLMConfigRead])
def get_llm_configs(session: Session = Depends(get_session), admin: User = Depends(get_admin_user)):
    _ = admin
    configs = session.exec(select(LLMConfig)).all()
    return [serialize_llm_config(config) for config in configs]

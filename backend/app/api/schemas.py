from datetime import datetime
from pydantic import BaseModel

from backend.app.domain.models import UserRole, UserStatus


class UserRead(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    status: UserStatus
    full_name: str | None = None
    mobile: str | None = None
    bio: str | None = None
    created_at: datetime


class TokenRead(BaseModel):
    access_token: str
    token_type: str
    user_status: UserStatus
    role: UserRole


class LLMConfigRead(BaseModel):
    id: int
    provider: str
    model: str
    temperature: float
    max_tokens: int
    is_active: bool
    updated_at: datetime
    has_api_key: bool

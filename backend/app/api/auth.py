from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlmodel import Session, select
from typing import Annotated, Optional
from backend.app.infrastructure.database import get_session
from backend.app.domain.models import User, UserStatus, UserRole
from backend.app.core.security import get_password_hash, verify_password, create_access_token
from pydantic import BaseModel, EmailStr
from backend.app.api.schemas import TokenRead, UserRead

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile: Optional[str] = None
    bio: Optional[str] = None

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    # Check if user already exists
    statement = select(User).where((User.username == user_in.username) | (User.email == user_in.email))
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or Email already registered")
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        status=UserStatus.PENDING,  # Default status
        role=UserRole.USER
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {"message": "User registered successfully, pending admin approval", "user_id": new_user.id}

@router.post("/login", response_model=TokenRead)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], session: Session = Depends(get_session)):
    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    
    if user.status != UserStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Your account status is: {user.status}")
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_status": user.status,
        "role": user.role
    }

def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        from jose import jwt
        from backend.app.core.config import settings
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    if user is None:
        raise credentials_exception
    return user

def get_admin_user(current_user: Annotated[User, Depends(get_current_user)]):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

@router.get("/me", response_model=UserRead)
def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "status": current_user.status,
        "full_name": current_user.full_name,
        "mobile": current_user.mobile,
        "bio": current_user.bio,
        "created_at": current_user.created_at,
    }

@router.put("/me/profile", response_model=UserRead)
def update_profile(profile: ProfileUpdate, current_user: Annotated[User, Depends(get_current_user)], session: Session = Depends(get_session)):
    if profile.full_name is not None:
        current_user.full_name = profile.full_name
    if profile.mobile is not None:
        current_user.mobile = profile.mobile
    if profile.bio is not None:
        current_user.bio = profile.bio
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "full_name": current_user.full_name,
        "mobile": current_user.mobile,
        "bio": current_user.bio,
        "status": current_user.status,
        "created_at": current_user.created_at,
    }

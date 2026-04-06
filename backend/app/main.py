from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from backend.app.infrastructure.database import init_db, engine
from backend.app.api import auth, chats, admin
from backend.app.core.config import settings
from backend.app.domain.models import LLMConfig, LLMProvider, User, UserRole, UserStatus
from app import something
app = FastAPI(title=settings.PROJECT_NAME)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    with Session(engine) as session:
        statement = select(User).where(User.username == settings.ADMIN_USERNAME)
        admin = session.exec(statement).first()
        if not admin:
            from backend.app.core.security import get_password_hash
            new_admin = User(
                username=settings.ADMIN_USERNAME,
                email="admin@example.com",
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                status=UserStatus.APPROVED,
                role=UserRole.ADMIN
            )
            session.add(new_admin)
            session.commit()
            print(f"Admin user '{settings.ADMIN_USERNAME}' created.")

        llm_statement = select(LLMConfig).where(LLMConfig.is_active == True)
        active_config = session.exec(llm_statement).first()
        if not active_config:
            session.add(
                LLMConfig(
                    provider=LLMProvider.GEMINI,
                    model="bootstrap-simulated",
                    api_key="",
                    temperature=0.7,
                    max_tokens=2000,
                    is_active=True,
                )
            )
            session.commit()
            print("Default LLM configuration created.")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(chats.router, prefix="/api/chats", tags=["chats"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

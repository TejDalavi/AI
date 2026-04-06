from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine
from backend.app.core.config import settings

engine = create_engine(settings.database_url, echo=False, pool_pre_ping=True)

def init_db():
    SQLModel.metadata.create_all(engine)
    with engine.begin() as connection:
        inspector = inspect(connection)
        if "llmconfig" not in inspector.get_table_names():
            return

        llm_columns = {column["name"] for column in inspector.get_columns("llmconfig")}
        if "api_key" not in llm_columns:
            connection.execute(text("ALTER TABLE llmconfig ADD COLUMN api_key VARCHAR NOT NULL DEFAULT ''"))

def get_session():
    with Session(engine) as session:
        yield session

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

# ✅ Your Render PostgreSQL URL
DATABASE_URL = "postgresql://ai_9e4e_user:qhM6EH8bCvRb9cblrjcvGYE5K8A0eyYn@dpg-d79q7j2a214c73b0hd2g-a.ohio-postgres.render.com/ai_9e4e"

# ✅ Create engine
engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True
)


def init_db():
    SQLModel.metadata.create_all(engine)

    with engine.begin() as connection:
        inspector = inspect(connection)

        if "llmconfig" not in inspector.get_table_names():
            return

        llm_columns = {column["name"] for column in inspector.get_columns("llmconfig")}

        if "api_key" not in llm_columns:
            connection.execute(
                text("ALTER TABLE llmconfig ADD COLUMN api_key VARCHAR NOT NULL DEFAULT ''")
            )


def get_session():
    with Session(engine) as session:
        yield session

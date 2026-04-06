from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

# ✅ Your Render PostgreSQL URL
DATABASE_URL = "postgresql://ai_gfq3_user:wR4PJ1EFBLiaqKw1gK5Ep0hZM7MLNNOr@dpg-d79nn7ruibrs73890lg0-a.ohio-postgres.render.com/ai_gfq3"

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

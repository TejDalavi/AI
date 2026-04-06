from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

from sqlmodel import Session, select

from backend.app.core.security import get_password_hash
from backend.app.domain.models import Chat, LLMConfig, LLMProvider, Message, MessageRole, User, UserRole, UserStatus
from backend.app.infrastructure.database import engine, init_db


def parse_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.utcnow()
    return datetime.fromisoformat(value)


def migrate(source: Path) -> None:
    data = json.loads(source.read_text(encoding="utf-8"))
    init_db()

    with Session(engine) as session:
        user_id_map: dict[int, int] = {}

        for raw_user in data.get("users", []):
            existing = session.exec(
                select(User).where(
                    (User.username == raw_user["username"]) | (User.email == raw_user["email"])
                )
            ).first()

            if existing:
                user = existing
            else:
                user = User(
                    username=raw_user["username"],
                    email=raw_user["email"],
                    hashed_password="",
                )

            user.email = raw_user["email"]
            user.hashed_password = get_password_hash(raw_user["password"])
            user.role = UserRole(raw_user.get("role", "user"))
            user.status = UserStatus(raw_user.get("status", "pending"))
            user.full_name = raw_user.get("full_name")
            user.mobile = raw_user.get("mobile")
            user.bio = raw_user.get("bio")
            user.created_at = parse_datetime(raw_user.get("created_at"))

            session.add(user)
            session.commit()
            session.refresh(user)
            user_id_map[raw_user["id"]] = user.id

        existing_chat_count = len(session.exec(select(Chat)).all())
        if existing_chat_count == 0:
            for raw_chat in data.get("chats", []):
                mapped_user_id = user_id_map.get(raw_chat.get("user_id"))
                if not mapped_user_id:
                    continue

                chat = Chat(
                    user_id=mapped_user_id,
                    title=raw_chat.get("title", "New Chat"),
                    created_at=parse_datetime(raw_chat.get("created_at")),
                    updated_at=parse_datetime(raw_chat.get("updated_at") or raw_chat.get("created_at")),
                )
                session.add(chat)
                session.commit()
                session.refresh(chat)

                for raw_message in data.get("messages", {}).get(str(raw_chat["id"]), []):
                    message = Message(
                        chat_id=chat.id,
                        role=MessageRole(raw_message["role"]),
                        content=raw_message["content"],
                        timestamp=parse_datetime(raw_message.get("timestamp")),
                    )
                    session.add(message)
                session.commit()

        raw_llm_config = data.get("llm_config")
        if raw_llm_config:
            active_configs = session.exec(select(LLMConfig).where(LLMConfig.is_active == True)).all()
            for config in active_configs:
                config.is_active = False
                session.add(config)

            session.add(
                LLMConfig(
                    provider=LLMProvider(raw_llm_config.get("provider", "gemini")),
                    model=raw_llm_config.get("model", "bootstrap-simulated"),
                    api_key=raw_llm_config.get("api_key", ""),
                    temperature=raw_llm_config.get("temperature", 0.7),
                    max_tokens=raw_llm_config.get("max_tokens", 2000),
                    is_active=raw_llm_config.get("is_active", True),
                    updated_at=parse_datetime(raw_llm_config.get("updated_at")),
                )
            )
            session.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Import mock JSON data into PostgreSQL.")
    parser.add_argument("source", type=Path, help="Path to the exported mock JSON file")
    args = parser.parse_args()
    migrate(args.source)


if __name__ == "__main__":
    main()

from backend.app.core.config import settings
from backend.app.api.auth import get_current_user
from backend.app.domain.models import Chat, LLMConfig, LLMProvider, Message, MessageRole, User
from backend.app.infrastructure.database import get_session
from fastapi import APIRouter, Depends, HTTPException
import httpx
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import List

router = APIRouter()

class ChatCreate(BaseModel):
    title: str = "New Chat"

class MessageCreate(BaseModel):
    content: str


def build_simulated_response(provider: str, prompt: str) -> str:
    return f"Simulated response from {provider}: I understand you said '{prompt}'"

@router.get("/", response_model=List[Chat])
def list_chats(session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    return session.exec(select(Chat).where(Chat.user_id == user.id).order_by(Chat.created_at.desc())).all()

@router.post("/", response_model=Chat)
def create_chat(chat_in: ChatCreate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    new_chat = Chat(user_id=user.id, title=chat_in.title)
    session.add(new_chat)
    session.commit()
    session.refresh(new_chat)
    return new_chat

@router.get("/{chat_id}/messages", response_model=List[Message])
def get_messages(chat_id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    chat = session.get(Chat, chat_id)
    if not chat or chat.user_id != user.id:
        raise HTTPException(status_code=404, detail="Chat not found")
    return session.exec(select(Message).where(Message.chat_id == chat_id).order_by(Message.timestamp.asc())).all()

class ChatRename(BaseModel):
    title: str

@router.patch("/{chat_id}/rename", response_model=Chat)
def rename_chat(chat_id: int, rename_in: ChatRename, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    chat = session.get(Chat, chat_id)
    if not chat or chat.user_id != user.id:
        raise HTTPException(status_code=404, detail="Chat not found")
    chat.title = rename_in.title.strip() or "New Chat"
    session.add(chat)
    session.commit()
    session.refresh(chat)
    return chat

@router.delete("/{chat_id}")
def delete_chat(chat_id: int, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    chat = session.get(Chat, chat_id)
    if not chat or chat.user_id != user.id:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Delete messages first
    messages = session.exec(select(Message).where(Message.chat_id == chat_id)).all()
    for msg in messages:
        session.delete(msg)
    
    session.delete(chat)
    session.commit()
    return {"message": "Chat deleted"}

@router.post("/{chat_id}/send")
async def send_message(chat_id: int, message_in: MessageCreate, session: Session = Depends(get_session), user: User = Depends(get_current_user)):
    chat = session.get(Chat, chat_id)
    if not chat or chat.user_id != user.id:
        raise HTTPException(status_code=404, detail="Chat not found")

    user_msg = Message(chat_id=chat_id, role=MessageRole.USER, content=message_in.content)

    active_config = session.exec(select(LLMConfig).where(LLMConfig.is_active == True)).first()
    if not active_config:
        raise HTTPException(status_code=500, detail="No active LLM configuration. Please contact admin.")

    history = session.exec(
        select(Message).where(Message.chat_id == chat_id).order_by(Message.timestamp.asc())
    ).all()
    messages_for_llm = [{"role": msg.role.value, "content": msg.content} for msg in history]
    messages_for_llm.append({"role": user_msg.role.value, "content": user_msg.content})

    try:
        provider_name = active_config.provider.value if isinstance(active_config.provider, LLMProvider) else str(active_config.provider)
        provider_api_key = active_config.api_key or settings.get_llm_api_key(provider_name)

        if active_config.provider == LLMProvider.OPENROUTER and provider_api_key:
            try:
                response_text = await call_openrouter(active_config, messages_for_llm, provider_api_key)
            except Exception:
                response_text = build_simulated_response(provider_name, message_in.content)
        else:
            response_text = build_simulated_response(provider_name, message_in.content)

        session.add(user_msg)
        if chat.title == "New Chat":
            chat.title = message_in.content[:50] + ("..." if len(message_in.content) > 50 else "")
        chat.updated_at = user_msg.timestamp
        session.add(chat)

        assistant_msg = Message(chat_id=chat_id, role=MessageRole.ASSISTANT, content=response_text)
        session.add(assistant_msg)
        session.commit()
        session.refresh(assistant_msg)
        return assistant_msg

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"LLM Error: {str(e)}")

async def call_openrouter(config: LLMConfig, messages: List[dict], provider_api_key: str):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {provider_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AI Chat App"
    }
    
    payload = {
        "model": config.model,
        "messages": messages,
        "temperature": config.temperature,
        "max_tokens": config.max_tokens
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload, timeout=60.0)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]

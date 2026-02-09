from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from langchain_community.chat_message_histories import SQLChatMessageHistory
from langchain_core.messages import BaseMessage


TEMPORARY_MODE = "temporary"
LONGTERM_MODE = "longterm"

# Long-term memory stores at most 7 rounds => 14 messages (user+assistant).
LONGTERM_MAX_MESSAGES = 14


def _default_db_path() -> Path:
    base_dir = Path(__file__).resolve().parents[1]
    data_dir = base_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir / "chat_memory.sqlite"


def _sqlite_connection_string(db_path: Path) -> str:
    # SQLAlchemy sqlite URL: sqlite:////absolute/path
    return f"sqlite:///{db_path.as_posix()}"


def normalize_memory_mode(raw: Optional[str]) -> str:
    v = (raw or "").strip().lower()
    if v in (LONGTERM_MODE, "long", "persistent", "cn"):
        return LONGTERM_MODE
    return TEMPORARY_MODE


def _session_key(*, session_id: Optional[str], actor_cn: Optional[str], memory_mode: str) -> str:
    cn = (actor_cn or "").strip() or "anon"
    if memory_mode == LONGTERM_MODE:
        return cn
    sid = (session_id or "").strip() or "default"
    return f"{cn}:{sid}"


def get_history(
    *,
    session_id: Optional[str],
    actor_cn: Optional[str],
    memory_mode: Optional[str] = None,
) -> SQLChatMessageHistory:
    raw = (os.getenv("CHAT_MEMORY_DB_PATH") or "").strip()
    db_path = Path(raw) if raw else _default_db_path()
    conn = _sqlite_connection_string(db_path)
    mode = normalize_memory_mode(memory_mode)
    return SQLChatMessageHistory(
        session_id=_session_key(session_id=session_id, actor_cn=actor_cn, memory_mode=mode),
        connection_string=conn,
    )


def take_last_messages(messages: list[BaseMessage], *, max_messages: int = 20) -> list[BaseMessage]:
    if max_messages <= 0:
        return []
    if len(messages) <= max_messages:
        return messages
    return messages[-max_messages:]


def enforce_longterm_cap(history: SQLChatMessageHistory) -> None:
    msgs = list(history.messages)
    if len(msgs) <= LONGTERM_MAX_MESSAGES:
        return
    kept = msgs[-LONGTERM_MAX_MESSAGES:]
    history.clear()
    history.add_messages(kept)

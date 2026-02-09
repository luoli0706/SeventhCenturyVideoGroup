from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, List


class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    category: Optional[str] = None


class ChatRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5
    category: Optional[str] = None
    history: Optional[List[dict]] = None


class StreamChatRequest(BaseModel):
    # Keep compatibility with the existing frontend payload from AIAssistant.vue
    sessionId: Optional[str] = None
    cn: Optional[str] = None
    memoryMode: Optional[str] = None
    message: str
    originalMessage: Optional[str] = None
    model: Optional[str] = None
    timestamp: Optional[str] = None
    relevantChunks: Optional[List[dict]] = None

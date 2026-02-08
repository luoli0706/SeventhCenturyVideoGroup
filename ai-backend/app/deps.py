from __future__ import annotations

from functools import lru_cache

from rag_service import RAGService


@lru_cache(maxsize=1)
def get_rag_service() -> RAGService:
    # Keep behavior similar to previous main.py: init once, reuse globally.
    print("Initializing RAG Service...")
    service = RAGService()
    print("RAG Service Initialized.")
    return service

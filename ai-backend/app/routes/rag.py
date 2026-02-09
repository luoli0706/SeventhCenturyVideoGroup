from __future__ import annotations

import glob
import os
import time
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.deps import get_rag_service
from app.schemas import ChatRequest, QueryRequest, StreamChatRequest

from chain.assistant_chain import stream_assistant_reply
from chain.mcp_register_chain import stream_mcp_register_reply

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.post("/initialize")
async def initialize_rag(background_tasks: BackgroundTasks):
    rag_service = get_rag_service()
    background_tasks.add_task(rag_service.load_documents)
    return {"message": "RAG init started in background", "status": "initializing"}


@router.post("/refresh")
async def refresh_documents(background_tasks: BackgroundTasks):
    rag_service = get_rag_service()
    background_tasks.add_task(rag_service.load_documents)
    return {"message": "RAG refresh started in background", "status": "refreshing"}


@router.post("/sync-members")
async def sync_members():
    rag_service = get_rag_service()
    result = rag_service.sync_members()
    if result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("message", "sync failed"))
    return result


@router.get("/status")
async def get_rag_status():
    rag_service = get_rag_service()
    return {"status": rag_service.get_status()}


@router.post("/query")
async def query_rag(request: QueryRequest):
    if not request.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    rag_service = get_rag_service()
    start_time = time.time()

    results = rag_service.query(request.query, request.top_k or 5)

    context = "\n".join([r["content"] for r in results])
    enhanced_query = f"Context:\n{context}\n\nQuestion: {request.query}"

    return {
        "query": request.query,
        "relevant_chunks": [
            {
                "title": r["metadata"].get("filename", "Unknown"),
                "content": r["content"],
                "similarity": r["score"],
                "chunk_id": 0,
                "document_id": 0,
            }
            for r in results
        ],
        "enhanced_query": enhanced_query,
        "processing_time": time.time() - start_time,
    }


@router.post("/chat")
async def chat_rag(request: ChatRequest):
    if not request.query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    rag_service = get_rag_service()
    start_time = time.time()

    response = rag_service.chat(request.query, request.history)
    if "error" in response:
        raise HTTPException(status_code=500, detail=response["error"])

    return {
        "query": request.query,
        "relevant_chunks": [],
        "enhanced_query": response.get("reply", ""),
        "n8n_response": response.get("reply", ""),
        "processing_time": time.time() - start_time,
    }


@router.post("/chat/stream")
async def chat_rag_stream(request: StreamChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    rag_service = get_rag_service()

    async def gen():
        async for line in stream_assistant_reply(
            rag=rag_service,
            question=request.originalMessage or request.message,
            relevant_chunks=request.relevantChunks,
            model=request.model,
            session_id=request.sessionId,
            actor_cn=request.cn,
            memory_mode=request.memoryMode,
        ):
            yield line

    return StreamingResponse(gen(), media_type="text/plain; charset=utf-8")


@router.post("/mcp/stream")
async def mcp_stream(request: StreamChatRequest, raw_request: Request):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    rag_service = get_rag_service()
    authorization = raw_request.headers.get("authorization")

    async def gen():
        async for line in stream_mcp_register_reply(
            rag=rag_service,
            question=request.originalMessage or request.message,
            relevant_chunks=request.relevantChunks,
            model=request.model,
            authorization=authorization,
            actor_cn=request.cn,
            session_id=request.sessionId,
            memory_mode=request.memoryMode,
        ):
            yield line

    return StreamingResponse(gen(), media_type="text/plain; charset=utf-8")


@router.get("/documents")
async def get_documents(page: int = 1, limit: int = 10, category: Optional[str] = None):
    rag_service = get_rag_service()
    data_path = rag_service.data_source_path
    if not os.path.exists(data_path):
        return {"documents": [], "total": 0, "page": page, "limit": limit}

    files = glob.glob(os.path.join(data_path, "**/*.md"), recursive=True)

    total = len(files)
    start = (page - 1) * limit
    end = start + limit
    paged_files = files[start:end]

    documents = []
    for i, file_path in enumerate(paged_files):
        stats = os.stat(file_path)
        filename = os.path.basename(file_path)
        documents.append(
            {
                "id": start + i + 1,
                "title": filename,
                "file_path": file_path,
                "category": "General",
                "updated_at": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                "created_at": datetime.fromtimestamp(stats.st_ctime).isoformat(),
            }
        )

    return {"documents": documents, "total": total, "page": page, "limit": limit}


@router.get("/faqs")
async def get_faqs():
    return {"faqs": [], "total": 0}

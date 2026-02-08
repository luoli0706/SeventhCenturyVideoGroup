from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, AsyncIterator, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from chain.prompt_loader import load_prompts
from rag_service import RAGService


def _normalize_model_name(model_name: Optional[str]) -> Optional[str]:
    """Map frontend-friendly model labels to DeepSeek/OpenAI-compatible ids."""

    if not model_name:
        return None

    raw = model_name.strip()
    if not raw:
        return None

    key = raw.lower()
    # Frontend currently uses marketing-like names; DeepSeek OpenAI-compatible API
    # expects concrete model ids.
    mapping = {
        "deepseek-v3": "deepseek-chat",
        "deepseek-r1": "deepseek-reasoner",
    }
    return mapping.get(key, raw)


def _build_context_from_chunks(relevant_chunks: Optional[list[dict[str, Any]]]) -> str:
    if not relevant_chunks:
        return ""
    parts: list[str] = []
    for i, chunk in enumerate(relevant_chunks[:6], start=1):
        title = chunk.get("title") or chunk.get("source") or f"chunk-{i}"
        content = chunk.get("content") or ""
        parts.append(f"【参考资料{i} - {title}】\n{content}")
    return "\n\n".join(parts)


def _build_context_via_retrieval(rag: RAGService, question: str, k: int = 4) -> str:
    results = rag.query(question, top_k=k)
    parts: list[str] = []
    for i, r in enumerate(results, start=1):
        title = (r.get("metadata") or {}).get("filename", f"doc-{i}")
        content = r.get("content", "")
        parts.append(f"【参考资料{i} - {title}】\n{content}")
    return "\n\n".join(parts)


async def stream_assistant_reply(
    *,
    rag: RAGService,
    question: str,
    relevant_chunks: Optional[list[dict[str, Any]]] = None,
    model: Optional[str] = None,
) -> AsyncIterator[str]:
    """Yield newline-delimited JSON objects: begin/item/end.

    This matches the frontend's stream parser (each line is a JSON object).
    """

    base_dir = Path(__file__).resolve().parents[1]
    system_prompt, user_template = load_prompts(base_dir)

    # Hot update: refresh index if files changed.
    rag.refresh_if_needed()

    context = _build_context_from_chunks(relevant_chunks)
    if not context.strip():
        context = _build_context_via_retrieval(rag, question, k=4)

    user_prompt = user_template.format(question=question, context=context)

    api_key = rag.api_key or os.getenv("DEEPSEEK_API_KEY")
    api_base = rag.api_base or os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")
    model_name = (
        _normalize_model_name(model)
        or rag.model_name
        or os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    )

    print(f"DeepSeek target: base={api_base} model={model_name} key_set={bool(api_key)}")

    llm = ChatOpenAI(
        model=model_name,
        openai_api_key=api_key,
        openai_api_base=api_base,
        temperature=0.3,
        streaming=True,
    )

    # Begin marker
    yield json.dumps({"type": "begin"}, ensure_ascii=False) + "\n"

    messages = []
    if system_prompt:
        messages.append(SystemMessage(content=system_prompt))
    messages.append(HumanMessage(content=user_prompt))

    # Stream tokens. If something goes wrong mid-stream (e.g. invalid model id),
    # still emit an end marker so the frontend can stop the loading indicator.
    try:
        async for chunk in llm.astream(messages):
            token = getattr(chunk, "content", None)
            if not token:
                continue
            yield json.dumps({"type": "item", "content": token}, ensure_ascii=False) + "\n"
    except Exception as e:
        msg = f"\n\n[AI 服务错误] {type(e).__name__}: {str(e)}"
        yield json.dumps({"type": "item", "content": msg}, ensure_ascii=False) + "\n"
    finally:
        # End marker
        yield json.dumps({"type": "end"}, ensure_ascii=False) + "\n"

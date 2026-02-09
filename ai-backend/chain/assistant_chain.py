from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, AsyncIterator, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from chain.prompt_loader import load_prompts
from chain.chat_memory import LONGTERM_MODE, enforce_longterm_cap, get_history, normalize_memory_mode, take_last_messages
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
    session_id: Optional[str] = None,
    actor_cn: Optional[str] = None,
    memory_mode: Optional[str] = None,
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

    mode = normalize_memory_mode(memory_mode)
    history = get_history(session_id=session_id, actor_cn=actor_cn, memory_mode=mode)
    messages = []
    if system_prompt:
        messages.append(SystemMessage(content=system_prompt))

    # Inject recent memory (user/assistant turns). Keep it bounded.
    try:
        max_inject = 14 if mode == LONGTERM_MODE else 20
        messages.extend(take_last_messages(list(history.messages), max_messages=max_inject))
    except Exception:
        # If history backend fails, continue without memory.
        pass

    messages.append(HumanMessage(content=user_prompt))

    # Stream tokens. If something goes wrong mid-stream (e.g. invalid model id),
    # still emit an end marker so the frontend can stop the loading indicator.
    assistant_parts: list[str] = []
    had_error = False
    try:
        async for chunk in llm.astream(messages):
            token = getattr(chunk, "content", None)
            if not token:
                continue
            assistant_parts.append(token)
            yield json.dumps({"type": "item", "content": token}, ensure_ascii=False) + "\n"
    except Exception as e:
        had_error = True
        msg = f"\n\n[AI 服务错误] {type(e).__name__}: {str(e)}"
        yield json.dumps({"type": "item", "content": msg}, ensure_ascii=False) + "\n"
    finally:
        if not had_error:
            try:
                final_text = "".join(assistant_parts).strip()
                if final_text:
                    # Store raw user question (not the context-augmented template) to keep memory small.
                    history.add_user_message((question or "").strip())
                    history.add_ai_message(final_text)
                    if mode == LONGTERM_MODE:
                        enforce_longterm_cap(history)
            except Exception:
                pass
        # End marker
        yield json.dumps({"type": "end"}, ensure_ascii=False) + "\n"


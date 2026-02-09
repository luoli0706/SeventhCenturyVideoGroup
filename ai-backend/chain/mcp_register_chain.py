from __future__ import annotations

import json
import os
import re
import secrets
import string
import uuid
import contextvars
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any, AsyncIterator, Optional

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from chain.assistant_chain import (
    _build_context_from_chunks,
    _build_context_via_retrieval,
    _normalize_model_name,
)
from chain.prompt_loader import load_prompts
from rag_service import RAGService


_AUTHORIZATION_HEADER: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "MCP_AUTHORIZATION_HEADER", default=None
)

_ACTOR_CN: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
	"MCP_ACTOR_CN", default=None
)


def _mcp_admin_cns() -> set[str]:
    raw = (os.getenv("MCP_ADMIN_CNS") or "").strip()
    if not raw:
        raw = "柠白夜,香煎包,猫德oxo,详见包"
    return {part.strip() for part in raw.split(",") if part.strip()}


def _is_admin(actor_cn: Optional[str]) -> bool:
    if not actor_cn:
        return False
    return actor_cn.strip() in _mcp_admin_cns()


_DSML_INVOKE_RE = re.compile(
    r"<\s*｜DSML｜invoke\s+name=\"(?P<name>[^\"]+)\"\s*>(?P<body>.*?)</\s*｜DSML｜invoke\s*>",
    re.DOTALL,
)
_DSML_PARAM_RE = re.compile(
    r"<\s*｜DSML｜parameter\s+name=\"(?P<name>[^\"]+)\"[^>]*>(?P<value>.*?)</\s*｜DSML｜parameter\s*>",
    re.DOTALL,
)


def _stringify_message_content(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        # LangChain sometimes uses list-of-blocks; best-effort stringify.
        return "\n".join(str(x) for x in content)
    return str(content)


def _coerce_tool_arg_value(raw: str) -> Any:
    text = (raw or "").strip()
    if text == "":
        return ""
    # Best-effort: parse JSON scalars/objects if present.
    if text in ("true", "false", "null") or text[:1] in ("{", "[", '"') or text.isdigit():
        try:
            return json.loads(text)
        except Exception:
            return text
    return text


def _extract_dsml_tool_calls(text: str) -> list[dict[str, Any]]:
    tool_calls: list[dict[str, Any]] = []
    if not text or "｜DSML｜invoke" not in text:
        return tool_calls

    for m in _DSML_INVOKE_RE.finditer(text):
        name = (m.group("name") or "").strip()
        body = m.group("body") or ""
        if not name:
            continue

        args: dict[str, Any] = {}
        for pm in _DSML_PARAM_RE.finditer(body):
            k = (pm.group("name") or "").strip()
            v = _coerce_tool_arg_value(pm.group("value") or "")
            if k:
                args[k] = v

        tool_calls.append({"id": f"dsml_{uuid.uuid4().hex}", "name": name, "args": args})

    return tool_calls


def _infer_forced_action(question: str) -> tuple[str, dict[str, Any]] | None:
    q = (question or "").strip()
    if not q:
        return None

    # Register-if-missing intent (common phrasing in tests)
    if "注册" in q and ("不存在" in q or "若不存在" in q or "如果不存在" in q):
        args: dict[str, Any] = {}
        # year
        m_year = re.search(r"(19\d{2}|20\d{2})", q)
        if m_year:
            args["year"] = m_year.group(1)
        # sex
        if "性别女" in q or "女生" in q or "女" in q:
            args["sex"] = "女"
        elif "性别男" in q or "男生" in q or "男" in q:
            args["sex"] = "男"
        # direction
        m_dir = re.search(r"(动画系|动画|三维|3D|特效|剪辑|后期|配音|美术)", q)
        if m_dir:
            args["direction"] = m_dir.group(1)
        # remark
        m_remark = re.search(r"备注\s*(?:为|是)?\s*[:：]?\s*(?P<val>[^。\n]+)", q)
        if m_remark:
            args["remark"] = m_remark.group("val").strip()
        return "register_if_missing", args

    # Delete intent
    if "删除" in q and ("成员" in q or "成员信息" in q or "我的" in q):
        return "delete_member", {}

    # Query intent (CN unrestricted)
    if ("查询" in q or "检查" in q) and ("成员" in q or "成员信息" in q or "是否存在" in q or "存在" in q or "我的" in q):
        return "get_member", {}

    # Update remark intent
    if ("更新" in q or "修改" in q) and "备注" in q:
        # Extract value after common separators.
        m = re.search(r"备注\s*(?:更新为|修改为|改为|更新|修改)\s*[:：]?\s*(?P<val>.+)$", q)
        if m:
            remark = m.group("val").strip().strip("。.")
            if remark:
                return "update_member", {"remark": remark}
        # If no explicit value, still allow update with empty remark.
        return "update_member", {}

    return None


def _extract_target_cn(question: str) -> Optional[str]:
    q = (question or "").strip()
    if not q:
        return None
    # Common patterns: “查询X是否…”, “检查成员X是否…”, “成员X是否存在…”
    patterns = [
        r"查询\s*(?P<cn>[^\s，。]{1,20})\s*是否",
        r"检查\s*成员\s*(?P<cn>[^\s，。]{1,20})\s*是否",
        r"成员\s*(?P<cn>[^\s，。]{1,20})\s*是否存在",
    ]
    for p in patterns:
        m = re.search(p, q)
        if m:
            cn = (m.group("cn") or "").strip()
            if cn:
                return cn
    return None


def _http_request(
    *,
    method: str,
    url: str,
    body: Optional[dict[str, Any]] = None,
    headers: Optional[dict[str, str]] = None,
    timeout: int = 15,
) -> tuple[int, dict[str, str], str]:
    headers = {**(headers or {})}
    data: Optional[bytes] = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")
	
    req = urllib.request.Request(url=url, data=data, method=method.upper(), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = getattr(resp, "status", 200)
            resp_headers = {k.lower(): v for k, v in resp.headers.items()}
            raw = resp.read().decode("utf-8", errors="replace")
            return status, resp_headers, raw
    except urllib.error.HTTPError as e:
        raw = ""
        try:
            raw = e.read().decode("utf-8", errors="replace")
        except Exception:
            pass
        resp_headers = {k.lower(): v for k, v in getattr(e, "headers", {}).items()} if getattr(e, "headers", None) else {}
        return int(getattr(e, "code", 500)), resp_headers, raw


class RegisterMemberInput(BaseModel):
    cn: str = Field(..., description="用户名/唯一标识")
    password: Optional[str] = Field(None, description="密码（至少 6 位）；不提供则使用默认值")
    sex: Optional[str] = None
    position: Optional[str] = None
    year: Optional[str] = None
    direction: Optional[str] = None
    status: Optional[str] = None
    remark: Optional[str] = None


class MemberCNInput(BaseModel):
	cn: str = Field(..., description="成员 cn")


class UpdateMemberInput(BaseModel):
	cn: str = Field(..., description="成员 cn（必须与当前登录用户一致）")
	sex: Optional[str] = None
	position: Optional[str] = None
	year: Optional[str] = None
	direction: Optional[str] = None
	status: Optional[str] = None
	is_member: Optional[bool] = None
	remark: Optional[str] = None


def _generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits
    # ensure at least one letter and one digit
    while True:
        pwd = "".join(secrets.choice(alphabet) for _ in range(length))
        if any(c.isalpha() for c in pwd) and any(c.isdigit() for c in pwd):
            return pwd


def _default_template() -> dict[str, str]:
    return {
        "sex": "",
        "position": "成员",
        "year": "",
        "direction": "",
        "status": "在役",
        "remark": "",
    }


def _clean_str(v: Optional[str]) -> Optional[str]:
    if v is None:
        return None
    return v.strip()


def _normalize_direction(v: Optional[str]) -> Optional[str]:
    v = _clean_str(v)
    if not v:
        return v
    # Common shorthand normalization observed in model outputs.
    if v == "动画":
        return "动画系"
    return v


@tool("register_member", args_schema=RegisterMemberInput)
def register_member(
    cn: str,
    password: Optional[str] = None,
    sex: Optional[str] = None,
    position: Optional[str] = None,
    year: Optional[str] = None,
    direction: Optional[str] = None,
    status: Optional[str] = None,
    remark: Optional[str] = None,
) -> str:
    """Call Go backend MCP register API: POST /api/mcp/register.

    Returns a JSON string describing result.
    """

    actor_cn = _ACTOR_CN.get()
    if actor_cn and not _is_admin(actor_cn):
        cn = actor_cn

    defaults = _default_template()
    used_password = password or os.getenv("MCP_REGISTER_DEFAULT_PASSWORD") or "0721"
    password_generated = False

    payload = {
        "cn": cn,
        "password": used_password,
        "sex": _clean_str(sex) if sex is not None else defaults["sex"],
        "position": _clean_str(position) if position is not None else defaults["position"],
        "year": _clean_str(year) if year is not None else defaults["year"],
        "direction": _normalize_direction(direction) if direction is not None else defaults["direction"],
        "status": _clean_str(status) if status is not None else defaults["status"],
        "remark": _clean_str(remark) if remark is not None else defaults["remark"],
    }

    go_base = os.getenv("GO_API_BASE", "http://127.0.0.1:7777")
    url = f"{go_base.rstrip('/')}/api/mcp/register"

    headers = {}
    auth = _AUTHORIZATION_HEADER.get()
    if auth:
        headers["Authorization"] = auth

    try:
        status_code, resp_headers, raw = _http_request(
            method="POST", url=url, body=payload, headers=headers, timeout=15
        )
        content_type = resp_headers.get("content-type", "")
        data: Any
        if "application/json" in content_type.lower():
            try:
                data = json.loads(raw) if raw else {}
            except Exception:
                data = {"raw": raw}
        else:
            data = {"raw": raw}

        result = {
            "ok": status_code in (200, 201),
            "status_code": status_code,
            "url": url,
            "request": {**payload, "password": "***"},
            "response": data,
            "cn": cn,
            "password_generated": password_generated,
            "password": used_password if password_generated else None,
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        result = {
            "ok": False,
            "error": f"{type(e).__name__}: {str(e)}",
            "url": url,
            "cn": cn,
        }
        return json.dumps(result, ensure_ascii=False)


@tool("get_member", args_schema=MemberCNInput)
def get_member(cn: str) -> str:
    """Get member info from Go backend: GET /api/mcp/club_members/{cn}.

    NOTE: Query has no CN restriction (auth required), per MCP permission rules.
    """
    go_base = os.getenv("GO_API_BASE", "http://127.0.0.1:7777")
    cn_enc = urllib.parse.quote(cn, safe="")
    url = f"{go_base.rstrip('/')}/api/mcp/club_members/{cn_enc}"
    headers = {}
    auth = _AUTHORIZATION_HEADER.get()
    if auth:
        headers["Authorization"] = auth

    try:
        status_code, resp_headers, raw = _http_request(
            method="GET", url=url, headers=headers, timeout=15
        )
        content_type = resp_headers.get("content-type", "")
        data: Any
        if "application/json" in content_type.lower():
            try:
                data = json.loads(raw) if raw else {}
            except Exception:
                data = {"raw": raw}
        else:
            data = {"raw": raw}
        result = {
            "ok": status_code == 200,
            "status_code": status_code,
            "url": url,
            "response": data,
            "cn": cn,
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        return json.dumps(
            {"ok": False, "error": f"{type(e).__name__}: {str(e)}", "url": url, "cn": cn},
            ensure_ascii=False,
        )


@tool("update_member", args_schema=UpdateMemberInput)
def update_member(
    cn: str,
    sex: Optional[str] = None,
    position: Optional[str] = None,
    year: Optional[str] = None,
    direction: Optional[str] = None,
    status: Optional[str] = None,
    is_member: Optional[bool] = None,
    remark: Optional[str] = None,
) -> str:
    """Update own member info (excluding password): PUT /api/mcp/club_members/{cn}."""

    actor_cn = _ACTOR_CN.get()
    if actor_cn and not _is_admin(actor_cn):
        cn = actor_cn
    go_base = os.getenv("GO_API_BASE", "http://127.0.0.1:7777")
    cn_enc = urllib.parse.quote(cn, safe="")
    url = f"{go_base.rstrip('/')}/api/mcp/club_members/{cn_enc}"
    headers = {"Content-Type": "application/json"}
    auth = _AUTHORIZATION_HEADER.get()
    if auth:
        headers["Authorization"] = auth

    payload: dict[str, Any] = {}
    if sex is not None:
        payload["sex"] = sex
    if position is not None:
        payload["position"] = position
    if year is not None:
        payload["year"] = year
    if direction is not None:
        payload["direction"] = direction
    if status is not None:
        payload["status"] = status
    if is_member is not None:
        payload["is_member"] = is_member
    if remark is not None:
        payload["remark"] = remark

    try:
        status_code, resp_headers, raw = _http_request(
            method="PUT", url=url, body=payload, headers=headers, timeout=15
        )
        content_type = resp_headers.get("content-type", "")
        data: Any
        if "application/json" in content_type.lower():
            try:
                data = json.loads(raw) if raw else {}
            except Exception:
                data = {"raw": raw}
        else:
            data = {"raw": raw}
        result = {
            "ok": status_code == 200,
            "status_code": status_code,
            "url": url,
            "request": payload,
            "response": data,
            "cn": cn,
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        return json.dumps(
            {"ok": False, "error": f"{type(e).__name__}: {str(e)}", "url": url, "cn": cn},
            ensure_ascii=False,
        )


@tool("delete_member", args_schema=MemberCNInput)
def delete_member(cn: str) -> str:
    """Delete own member row: DELETE /api/mcp/club_members/{cn}."""

    actor_cn = _ACTOR_CN.get()
    if actor_cn and not _is_admin(actor_cn):
        cn = actor_cn
    go_base = os.getenv("GO_API_BASE", "http://127.0.0.1:7777")
    cn_enc = urllib.parse.quote(cn, safe="")
    url = f"{go_base.rstrip('/')}/api/mcp/club_members/{cn_enc}"
    headers = {}
    auth = _AUTHORIZATION_HEADER.get()
    if auth:
        headers["Authorization"] = auth
    try:
        status_code, resp_headers, raw = _http_request(
            method="DELETE", url=url, headers=headers, timeout=15
        )
        content_type = resp_headers.get("content-type", "")
        data: Any
        if "application/json" in content_type.lower():
            try:
                data = json.loads(raw) if raw else {}
            except Exception:
                data = {"raw": raw}
        else:
            data = {"raw": raw}
        result = {
            "ok": status_code in (200, 204),
            "status_code": status_code,
            "url": url,
            "response": data,
            "cn": cn,
        }
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        return json.dumps(
            {"ok": False, "error": f"{type(e).__name__}: {str(e)}", "url": url, "cn": cn},
            ensure_ascii=False,
        )


def _load_mcp_register_prompt() -> str:
    base_dir = Path(__file__).resolve().parents[1]
    prompt_path = base_dir / "prompt" / "MCP-Prompt_Register.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    return ""


def _build_proxy_system_prompt(base_dir: Path) -> str:
    base_system, _ = load_prompts(base_dir)
    mcp_system = _load_mcp_register_prompt()
    parts = [p.strip() for p in [base_system, mcp_system] if p and p.strip()]
    return "\n\n".join(parts).strip()


async def stream_mcp_register_reply(
    *,
    rag: RAGService,
    question: str,
    relevant_chunks: Optional[list[dict[str, Any]]] = None,
    model: Optional[str] = None,
    authorization: Optional[str] = None,
    actor_cn: Optional[str] = None,
) -> AsyncIterator[str]:
    """Stream begin/item/end; in Proxy(MCP) mode uses tool to register via Go API."""

    # Keep RAG context behavior consistent with Ask mode.
    rag.refresh_if_needed()

    context = _build_context_from_chunks(relevant_chunks)
    if not context.strip():
        context = _build_context_via_retrieval(rag, question, k=4)

    # Reuse existing base prompts; system prompt = system.md + MCP prompt.
    base_dir = Path(__file__).resolve().parents[1]
    proxy_system = _build_proxy_system_prompt(base_dir)
    _, user_template = load_prompts(base_dir)
    user_prompt = user_template.format(question=question, context=context)

    api_key = rag.api_key or os.getenv("DEEPSEEK_API_KEY")
    api_base = rag.api_base or os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")
    model_name = (
        _normalize_model_name(model)
        or rag.model_name
        or os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
    )

    # Begin marker
    yield json.dumps({"type": "begin"}, ensure_ascii=False) + "\n"

    try:
        # Set per-request auth for tools
        token = None
        cn_token = None
        if authorization and authorization.strip():
            token = _AUTHORIZATION_HEADER.set(authorization.strip())
        if actor_cn and actor_cn.strip():
            cn_token = _ACTOR_CN.set(actor_cn.strip())

        tools = [register_member, get_member, update_member, delete_member]

        planner = ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
            openai_api_base=api_base,
            temperature=0.1,
            streaming=False,
        ).bind_tools(tools)

        messages = []
        if proxy_system:
            messages.append(SystemMessage(content=proxy_system))
        messages.append(HumanMessage(content=user_prompt))

        actor_cn_norm = actor_cn.strip() if actor_cn and actor_cn.strip() else None
        actor_is_admin = _is_admin(actor_cn_norm)
        target_cn_in_question = _extract_target_cn(question)

        # Deterministic routing for simple CRUD intents (improves reliability).
        forced = _infer_forced_action(question)

        tool_steps = 0
        registered_cn: Optional[str] = actor_cn_norm
        last_register_result: Optional[str] = None
        last_verify_result: Optional[str] = None

        if forced is not None:
            action, extra_args = forced
            if action == "register_if_missing":
                target_cn = target_cn_in_question or actor_cn_norm or ""
                # First check existence
                yield json.dumps({"type": "item", "content": "正在查询成员信息...\n"}, ensure_ascii=False) + "\n"
                exists = get_member.invoke({"cn": target_cn})
                messages.append(HumanMessage(content=f"【工具结果:get_member】\n{exists}"))

                try:
                    exists_obj = json.loads(exists)
                    exists_ok = bool(exists_obj.get("ok"))
                except Exception:
                    exists_ok = False

                if not exists_ok:
                    if actor_is_admin or (actor_cn_norm and target_cn == actor_cn_norm):
                        yield json.dumps({"type": "item", "content": "正在调用注册接口...\n"}, ensure_ascii=False) + "\n"
                        reg_args = {"cn": target_cn}
                        reg_args.update(extra_args)
                        reg = register_member.invoke(reg_args)
                        messages.append(HumanMessage(content=f"【工具结果:register_member】\n{reg}"))
                    else:
                        messages.append(
                            HumanMessage(
                                content=(
                                    "【权限提示】普通成员只能为自己注册；当前登录用户与目标 cn 不一致，已跳过注册步骤。"
                                )
                            )
                        )

                # Mandatory verification after register / or after confirming exists
                yield json.dumps({"type": "item", "content": "正在查询校验注册信息...\n"}, ensure_ascii=False) + "\n"
                verify = get_member.invoke({"cn": target_cn})
                messages.append(
                    HumanMessage(
                        content=(
                            "【系统校验】注册流程结束后已自动调用查询接口进行核对。\n"
                            f"查询结果(JSON)：\n{verify}"
                        )
                    )
                )
            elif action == "get_member":
                # Query is CN-unrestricted: prefer CN extracted from question; fallback to self.
                target_cn = target_cn_in_question or actor_cn_norm or ""
                yield json.dumps({"type": "item", "content": "正在查询成员信息...\n"}, ensure_ascii=False) + "\n"
                result = get_member.invoke({"cn": target_cn})
                messages.append(HumanMessage(content=f"【工具结果:get_member】\n{result}"))
            elif action == "update_member":
                # Update is CN-restricted; admin may force.
                target_cn = target_cn_in_question or actor_cn_norm or ""
                yield json.dumps({"type": "item", "content": "正在更新成员信息...\n"}, ensure_ascii=False) + "\n"
                args = {"cn": target_cn}
                args.update(extra_args)
                result = update_member.invoke(args)
                messages.append(HumanMessage(content=f"【工具结果:update_member】\n{result}"))
                verify = get_member.invoke({"cn": target_cn})
                messages.append(
                    HumanMessage(
                        content=(
                            "【系统校验】更新完成后已自动调用查询接口进行核对。\n"
                            f"查询结果(JSON)：\n{verify}"
                        )
                    )
                )
            elif action == "delete_member":
                # Delete is CN-restricted; admin may force.
                target_cn = target_cn_in_question or actor_cn_norm or ""
                yield json.dumps({"type": "item", "content": "正在删除成员信息...\n"}, ensure_ascii=False) + "\n"
                result = delete_member.invoke({"cn": target_cn})
                messages.append(HumanMessage(content=f"【工具结果:delete_member】\n{result}"))
                verify = get_member.invoke({"cn": target_cn})
                messages.append(
                    HumanMessage(
                        content=(
                            "【系统校验】删除完成后已自动调用查询接口进行核对。\n"
                            f"查询结果(JSON)：\n{verify}"
                        )
                    )
                )
            else:
                forced = None

        if forced is None:
            while tool_steps < 7:
                planned = planner.invoke(messages)
                tool_calls = getattr(planned, "tool_calls", None) or []
                if not tool_calls:
                    planned_text = _stringify_message_content(getattr(planned, "content", None))
                    tool_calls = _extract_dsml_tool_calls(planned_text)
                if not tool_calls:
                    # No more tool calls -> final answer stage
                    messages.append(planned)
                    break

                messages.append(planned)
                for call in tool_calls:
                    tool_steps += 1
                    if tool_steps > 7:
                        break

                    name = call.get("name")
                    args = call.get("args") or {}
                    call_id = call.get("id") or ""

                    if name == "register_member":
                        yield json.dumps({"type": "item", "content": "正在调用注册接口...\n"}, ensure_ascii=False) + "\n"
                        last_register_result = register_member.invoke(args)
                        try:
                            parsed = json.loads(last_register_result)
                            registered_cn = parsed.get("cn") or args.get("cn")
                        except Exception:
                            registered_cn = args.get("cn")

                        messages.append(ToolMessage(content=last_register_result, tool_call_id=call_id))

                        if registered_cn:
                            yield json.dumps({"type": "item", "content": "正在查询校验注册信息...\n"}, ensure_ascii=False) + "\n"
                            last_verify_result = get_member.invoke({"cn": registered_cn})
                            messages.append(
                                HumanMessage(
                                    content=(
                                        "【系统校验】注册完成后已自动调用查询接口进行核对。\n"
                                        f"查询结果(JSON)：\n{last_verify_result}"
                                    )
                                )
                            )
                    elif name == "get_member":
                        result = get_member.invoke(args)
                        messages.append(ToolMessage(content=result, tool_call_id=call_id))
                    elif name == "update_member":
                        result = update_member.invoke(args)
                        messages.append(ToolMessage(content=result, tool_call_id=call_id))
                    elif name == "delete_member":
                        result = delete_member.invoke(args)
                        messages.append(ToolMessage(content=result, tool_call_id=call_id))
                    else:
                        messages.append(
                            ToolMessage(
                                content=json.dumps(
                                    {"ok": False, "error": f"unknown tool: {name}"},
                                    ensure_ascii=False,
                                ),
                                tool_call_id=call_id,
                            )
                        )

        # Stream final response
        responder_system = (
            "你是代理执行结果的解释器。根据对话中工具返回的 JSON 结果，用简洁中文告诉用户执行是否成功。"
            "注册场景必须明确：注册是否成功、用户名(cn)、默认密码为 0721（如果用户未自定义），"
            "并引用【系统校验】中的查询结果来确认信息存在且字段正确。"
            "如果出现权限错误（403），解释这是为了防止篡改他人信息。"
        )

        responder = ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
            openai_api_base=api_base,
            temperature=0.2,
            streaming=True,
        )

        final_messages = [SystemMessage(content=responder_system)]
        final_messages.extend(messages)
        if last_register_result or last_verify_result:
            final_messages.append(
                HumanMessage(
                    content=(
                        "请输出最终结论与下一步建议；不要重复无关背景。\n"
                        "若注册失败：给出原因与如何修正。"
                    )
                )
            )

        async for chunk in responder.astream(final_messages):
            token_text = getattr(chunk, "content", None)
            if token_text:
                yield json.dumps({"type": "item", "content": token_text}, ensure_ascii=False) + "\n"
    except Exception as e:
        msg = f"\n\n[MCP 代理错误] {type(e).__name__}: {str(e)}"
        yield json.dumps({"type": "item", "content": msg}, ensure_ascii=False) + "\n"
    finally:
        # Reset auth contextvar
        try:
            if token is not None:
                _AUTHORIZATION_HEADER.reset(token)
        except Exception:
            pass
        try:
            if cn_token is not None:
                _ACTOR_CN.reset(cn_token)
        except Exception:
            pass
        yield json.dumps({"type": "end"}, ensure_ascii=False) + "\n"

from __future__ import annotations

from pathlib import Path


def read_text(file_path: Path) -> str:
    return file_path.read_text(encoding="utf-8")


def load_prompts(base_dir: Path) -> tuple[str, str]:
    system_path = base_dir / "prompt" / "system.md"
    user_path = base_dir / "prompt" / "user.md"

    system_prompt = read_text(system_path) if system_path.exists() else ""
    user_prompt = read_text(user_path) if user_path.exists() else "{question}\n\n{context}"

    return system_prompt.strip(), user_prompt.strip()

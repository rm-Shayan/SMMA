import json
from typing import Generator
import httpx
from .config import settings


def _prepare_payload(prompt: str, system_prompt: str | None, max_tokens: int, stream: bool = False):
    headers = {"Content-Type": "application/json"}
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    if settings["use_local_llm"]:
        url = f"{settings['local_llm_url'].rstrip('/')}/chat/completions"
        payload = {"model": settings["local_llm_model"], "messages": messages, "max_tokens": max_tokens, "stream": stream}
    elif settings["groq_api_key"]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers["Authorization"] = f"Bearer {settings['groq_api_key']}"
        payload = {"model": settings["groq_model"] or "qwen/qwen3.8-27b", "messages": messages, "max_tokens": max_tokens, "stream": stream}
    else:
        return None, None, None
    return url, headers, payload


def generate_text(prompt: str, system_prompt: str | None = None, max_tokens: int = 800) -> str | None:
    url, headers, payload = _prepare_payload(prompt, system_prompt, max_tokens, stream=False)
    if not url:
        return None
    try:
        with httpx.Client(timeout=25.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        pass
    return None


def generate_text_stream(prompt: str, system_prompt: str | None = None, max_tokens: int = 800) -> Generator[str, None, None]:
    url, headers, payload = _prepare_payload(prompt, system_prompt, max_tokens, stream=True)
    if not url:
        yield "AI inference engine not configured."
        return
    try:
        with httpx.stream("POST", url, headers=headers, json=payload, timeout=30.0) as resp:
            for line in resp.iter_lines():
                if line.startswith("data: ") and line != "data: [DONE]":
                    try:
                        chunk = json.loads(line[6:])
                        delta = chunk["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except Exception:
                        continue
    except Exception as exc:
        yield f" [Stream interrupted: {exc}]"

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .base_agent import BaseAgent

_REGISTRY: dict[str, "BaseAgent"] = {}


def register(agent: "BaseAgent") -> None:
    _REGISTRY[agent.code] = agent


def get(code: str) -> "BaseAgent | None":
    k = (code or "").strip()
    return _REGISTRY.get(k) or _REGISTRY.get(k.replace("-", "_")) or _REGISTRY.get(k.replace("_", "-"))


def codes() -> list[str]:
    return list(_REGISTRY.keys())

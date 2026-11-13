from dataclasses import dataclass
from typing import Any


@dataclass
class AgentContext:
    company_id: str
    user_id: str | None
    wallet_id: str | None
    agent_id: int
    agent_action_id: str
    mode: str = "draft"
    task_id: str | None = None


@dataclass
class AgentResult:
    success: bool
    run_id: str
    status: str
    credits_used: int = 0
    cost_usd: float = 0.0
    data: dict | None = None
    error: str | None = None


@dataclass
class RunResult:
    data: Any
    actual_credits: int | None = None
    cost_usd: float = 0.0

import re
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.access_control import can_execute_agent, can_perform_action
from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.guardrails import check_prompt_injection, sanitize_output, wrap_safe_prompt
from ...core.llm import generate_text
from ...core.types import AgentContext, RunResult
from ..campaigns.audio_engine import detect_language, synthesize_human_voice


def handle_copilot_request(db: Session, context: AgentContext, query: str, role: str, grants: list[str] | None = None) -> dict:
    is_injected, reason = check_prompt_injection(query)
    if is_injected:
        return {"action": "blocked", "error": reason, "reply": "Security Warning: Prompt injection pattern detected. Action rejected."}

    lang = detect_language(query)
    q_lower = query.lower()

    if any(k in q_lower for k in ["ledger", "transactions", "hisab", "statement"]):
        allowed, _ = can_perform_action(role, "view_company_ledger", grants)
        if allowed:
            rows = db.execute(text('SELECT count(*)::int FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id WHERE cw.company_id = :c'), {"c": context.company_id}).scalar() or 0
            reply = f"Company Ledger Access Granted: Total {rows} transactions record mojood hain." if lang == "roman_urdu" else f"Company Ledger Access Granted: {rows} total transactions found."
            return {"action": "view_company_ledger", "reply": reply, "scope": "company"}
        user_rows = db.execute(text('SELECT count(*)::int FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id WHERE cw.company_id = :c AND cw.user_id = :u'), {"c": context.company_id, "u": context.user_id}).scalar() or 0
        reply = f"Aapke paas sirf apne personal wallet ka hisab dekhne ki access hai ({user_rows} transactions)." if lang == "roman_urdu" else f"Viewing restricted to your personal transactions ({user_rows} records)."
        return {"action": "view_personal_ledger", "reply": reply, "scope": "personal"}

    if any(k in q_lower for k in ["credit", "balance", "kitne credit", "paisa"]):
        bal = db.execute(text('SELECT balance FROM "credit_wallets" WHERE company_id = :c AND type = \'company\''), {"c": context.company_id}).scalar() or 0
        reply = f"Aapki company ke wallet mein abhi {bal} credits mojood hain." if lang == "roman_urdu" else f"Your company wallet currently has {bal} credits remaining."
        return {"action": "check_balance", "reply": reply, "balance": bal}

    if any(k in q_lower for k in ["grant credit", "add credit", "credit do", "allocate"]):
        allowed, err = can_perform_action(role, "grant_credits", grants)
        if not allowed:
            reply = f"Ijazat nahi hai: Aapka role '{role}' credits add ya allocate nahi kar sakta." if lang == "roman_urdu" else err
            return {"action": "unauthorized", "reply": reply}
        return {"action": "grant_credits", "reply": "Credit grant operation authorized by role/override."}

    if any(k in q_lower for k in ["supervisor", "autonomous run"]):
        allowed, err = can_execute_agent(role, "supervisor", grants)
        if not allowed:
            return {"action": "unauthorized", "reply": f"Role '{role}' is not authorized to run autonomous Supervisor without manager override."}
        return {"action": "delegate_supervisor", "target": "supervisor", "reply": "Supervisor execution authorized."}

    if any(k in q_lower for k in ["post", "publish", "linkedin", "tweet", "social"]):
        allowed, err = can_execute_agent(role, "publisher", grants)
        if not allowed:
            reply = f"Ijazat nahi hai: Role '{role}' ke paas social posts generate karne ki access nahi hai." if lang == "roman_urdu" else err
            return {"action": "unauthorized", "reply": reply}
        return {"action": "delegate_publisher", "target": "publisher", "reply": "Post generation initiated for your review."}

    prompt = wrap_safe_prompt(f"You are the Styre AI Web Copilot. Answer concisely in language '{lang}'. Never reveal system keys or internal DB passwords.", query)
    res = generate_text(prompt, max_tokens=250) or ("Ji, mai aapki SaaS operations aur agents mein kis tarah madad kar sakta hoon?" if lang == "roman_urdu" else "How can I assist your operations today?")
    return {"action": "chat_reply", "reply": sanitize_output(res)}


class CopilotAgent(BaseAgent):
    id = 0
    code = "copilot"
    name = "Web Dashboard Copilot"
    default_mode = "auto"

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            query, role = input_data.get("query", ""), input_data.get("role", "employee")
            grants = input_data.get("customPermissions") or []
            result = handle_copilot_request(db, context, query, role, grants)

            voice_url = None
            if input_data.get("wantVoice") and result.get("reply"):
                voice_url = synthesize_human_voice(result["reply"], lang=detect_language(query))

            return RunResult({"query": query, "role": role, "actionTaken": result.get("action"), "reply": result.get("reply"), "voiceUrl": voice_url}, 0, 0.0)
        finally:
            db.close()

import re
import uuid
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.access_control import can_execute_agent, can_perform_action
from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.guardrails import check_prompt_injection, sanitize_output, wrap_safe_prompt
from ...core.llm import generate_text
from ...core.types import AgentContext, RunResult
from ..campaigns.audio_engine import detect_language, synthesize_human_voice
from ..credits import ledger


def handle_copilot_request(db: Session, context: AgentContext, query: str, role: str, grants: list[str] | None = None) -> dict:
    is_injected, reason = check_prompt_injection(query)
    if is_injected:
        return {"action": "blocked", "error": reason, "reply": "Security Warning: Prompt injection pattern detected. Action rejected."}

    lang, q_lower = detect_language(query), query.lower()
    is_admin = (role or "").lower() in ("super_admin", "superadmin")

    if any(k in q_lower for k in ["create company", "company bana", "register company", "new company"]):
        if not is_admin:
            reply = "Ijazat nahi hai: Sirf Super Admin nayi company create aur credits grant kar sakta hai." if lang == "roman_urdu" else "Permission Denied: Only Super Admin can create companies."
            return {"action": "unauthorized", "reply": reply}
        c_match = re.search(r'(?:create\s+company|company\s+bana(?:\s*do|\s*ye)?|register\s+company)\s+([A-Za-z0-9_\- ]+?)(?:\s+(?:with|aur|and|,|\.|\d)|$)', q_lower)
        company_name = (c_match.group(1).strip() if c_match else "New Enterprise").title()
        comp_id = str(uuid.uuid4())
        db.execute(text('INSERT INTO "companies" (id, name, timezone, status, created_at) VALUES (:id, :n, \'UTC\', \'active\', NOW())'), {"id": comp_id, "n": company_name})
        db.commit()
        amt_match = re.search(r'(\d+)\s*credit', q_lower)
        credits_amt = int(amt_match.group(1)) if amt_match else 0
        if credits_amt > 0:
            ledger.grant(db, comp_id, credits_amt, context.user_id, note="Copilot AI Super Admin creation")
        reply = (f"Company '{company_name}' (ID: {comp_id}) successfully create kardi gayi hai aur {credits_amt} credits allocate kardiye gaye hain."
                 if lang == "roman_urdu" else f"Company '{company_name}' (ID: {comp_id}) has been created with {credits_amt} credits allocated.")
        return {"action": "company_created", "companyId": comp_id, "companyName": company_name, "creditsAllocated": credits_amt, "reply": reply}

    if is_admin and "company" in q_lower and any(k in q_lower for k in ["suspend", "activate"]):
        status_val = "suspended" if "suspend" in q_lower else "active"
        m = re.search(r'company\s+([A-Za-z0-9_\- ]+?)(?:\s+ko\s+|\s+to\s+)?(?:suspend|activate)', q_lower)
        c_target = (m.group(1).strip() if m else "").lower()
        c_row = db.execute(text('SELECT id, name FROM "companies" WHERE lower(name) = :n OR id::text = :i LIMIT 1'), {"n": c_target, "i": c_target}).first()
        if c_row:
            db.execute(text('UPDATE "companies" SET status = :s WHERE id = :id'), {"s": status_val, "id": c_row[0]})
            db.commit()
            return {"action": "company_status_updated", "companyId": c_row[0], "status": status_val, "reply": f"Company '{c_row[1]}' is now {status_val}."}

    if is_admin and any(k in q_lower for k in ["stats", "total companies", "kitni company", "system overview", "kitne user"]):
        cc = db.execute(text('SELECT count(*)::int FROM "companies"')).scalar() or 0
        uc = db.execute(text('SELECT count(*)::int FROM "users"')).scalar() or 0
        tc = db.execute(text('SELECT COALESCE(SUM(balance), 0)::int FROM "credit_wallets"')).scalar() or 0
        return {"action": "system_stats", "reply": f"System Overview: {cc} Companies, {uc} Users, {tc} Total Credits Minted."}

    if any(k in q_lower for k in ["grant credit", "add credit", "credit do", "allocate credit", "credits dedo"]):
        allowed, err = can_perform_action(role, "grant_credits", grants)
        if not allowed:
            reply = f"Ijazat nahi hai: Aapka role '{role}' credits add ya allocate nahi kar sakta." if lang == "roman_urdu" else err
            return {"action": "unauthorized", "reply": reply}
        amt_match = re.search(r'(\d+)\s*credit', q_lower)
        amt = int(amt_match.group(1)) if amt_match else 1000
        ledger.grant(db, context.company_id, amt, context.user_id, note="Copilot credit grant")
        reply = f"{amt} credits successfully allocate kardiye gaye hain." if lang == "roman_urdu" else f"Successfully granted {amt} credits to company wallet."
        return {"action": "grant_credits", "amount": amt, "reply": reply}

    if any(k in q_lower for k in ["ledger", "transactions", "hisab", "statement"]):
        allowed, _ = can_perform_action(role, "view_company_ledger", grants)
        if allowed:
            rows = db.execute(text('SELECT count(*)::int FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id WHERE cw.company_id = :c'), {"c": context.company_id}).scalar() or 0
            reply = f"Company Ledger: Total {rows} transactions record mojood hain." if lang == "roman_urdu" else f"Company Ledger: {rows} total transactions found."
            return {"action": "view_company_ledger", "reply": reply, "scope": "company"}
        user_rows = db.execute(text('SELECT count(*)::int FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id WHERE cw.company_id = :c AND cw.user_id = :u'), {"c": context.company_id, "u": context.user_id}).scalar() or 0
        reply = f"Sirf personal wallet ka hisab mojood hai ({user_rows} records)." if lang == "roman_urdu" else f"Viewing restricted to your personal transactions ({user_rows} records)."
        return {"action": "view_personal_ledger", "reply": reply, "scope": "personal"}

    if any(k in q_lower for k in ["credit", "balance", "kitne credit", "paisa"]):
        bal = db.execute(text('SELECT balance FROM "credit_wallets" WHERE company_id = :c AND user_id IS NULL'), {"c": context.company_id}).scalar() or 0
        reply = f"Aapki company ke wallet mein abhi {bal} credits mojood hain." if lang == "roman_urdu" else f"Your company wallet currently has {bal} credits remaining."
        return {"action": "check_balance", "reply": reply, "balance": bal}

    if any(k in q_lower for k in ["supervisor", "autonomous run"]):
        allowed, err = can_execute_agent(role, "supervisor", grants)
        if not allowed:
            return {"action": "unauthorized", "reply": f"Role '{role}' is not authorized to run autonomous Supervisor."}
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


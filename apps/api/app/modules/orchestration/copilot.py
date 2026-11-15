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

    if any(k in q_lower for k in ["disconnect", "reconnect"]):
        is_disc = "disconnect" in q_lower
        new_status = "disconnected" if is_disc else "active"
        target_p = next((("instagram" if p == "insta" else ("facebook" if p == "fb" else p)) for p in ["instagram", "insta", "facebook", "fb", "meta", "linkedin", "whatsapp", "twitter", "threads"] if p in q_lower), None)
        if target_p:
            acc = db.execute(text('SELECT id, provider, display_name FROM "connected_accounts" WHERE company_id = :c AND (lower(provider) = :p OR lower(display_name) LIKE :pl) LIMIT 1'), {"c": context.company_id, "p": target_p, "pl": f"%{target_p}%"}).first()
            if not acc:
                return {"action": "account_not_found", "provider": target_p, "reply": f"'{target_p}' account connected nahi mila." if lang == "roman_urdu" else f"No connected '{target_p}' account found."}
            db.execute(text('UPDATE "connected_accounts" SET status = :s WHERE id = :id'), {"s": new_status, "id": acc[0]})
            purged = db.execute(text('UPDATE "outbox_jobs" SET status = \'expired\' WHERE connected_account_id = :id AND status IN (\'queued\', \'paused\')'), {"id": acc[0]}).rowcount if is_disc else 0
            db.commit()
            reply = (f"Platform '{acc[1]}' ({acc[2]}) disconnect kardia gaya. {purged} pending outbox jobs expire kardi gayi hain taake agle 30-50 din ya saal baad purani posts na dispatch hon." if is_disc else f"Platform '{acc[1]}' ({acc[2]}) reconnect kardia gaya hai aur active hai.") if lang == "roman_urdu" else (f"Platform '{acc[1]}' ({acc[2]}) disconnected. {purged} pending outbox jobs expired to prevent stale execution." if is_disc else f"Platform '{acc[1]}' ({acc[2]}) reconnected and active.")
            return {"action": f"platform_{new_status}", "accountId": str(acc[0]), "provider": acc[1], "purgedJobs": purged, "reply": reply}

    if any(k in q_lower for k in ["create company", "company bana", "register company", "new company"]):
        if not is_admin:
            return {"action": "unauthorized", "reply": "Ijazat nahi hai: Sirf Super Admin nayi company create kar sakta hai." if lang == "roman_urdu" else "Permission Denied: Only Super Admin can create companies."}
        c_match = re.search(r'(?:create\s+company|company\s+bana(?:\s*do|\s*ye)?|register\s+company)\s+([A-Za-z0-9_\- ]+?)(?:\s+(?:with|aur|and|,|\.|\d)|$)', q_lower)
        company_name = (c_match.group(1).strip() if c_match else "New Enterprise").title()
        comp_id = str(uuid.uuid4())
        db.execute(text('INSERT INTO "companies" (id, name, timezone, status, created_at) VALUES (:id, :n, \'UTC\', \'active\', NOW())'), {"id": comp_id, "n": company_name})
        db.commit()
        amt_match = re.search(r'(\d+)\s*credit', q_lower)
        credits_amt = int(amt_match.group(1)) if amt_match else 0
        if credits_amt > 0:
            ledger.grant(db, comp_id, credits_amt, context.user_id, note="Copilot AI Super Admin creation")
        reply = (f"Company '{company_name}' create kardi gayi hai aur {credits_amt} credits allocate kardiye gaye hain." if lang == "roman_urdu" else f"Company '{company_name}' created with {credits_amt} credits allocated.")
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
            return {"action": "unauthorized", "reply": f"Ijazat nahi hai: Role '{role}' credits allocate nahi kar sakta." if lang == "roman_urdu" else err}
        amt_match = re.search(r'(\d+)\s*credit', q_lower)
        amt = int(amt_match.group(1)) if amt_match else 1000
        ledger.grant(db, context.company_id, amt, context.user_id, note="Copilot credit grant")
        return {"action": "grant_credits", "amount": amt, "reply": f"{amt} credits allocate kardiye gaye hain." if lang == "roman_urdu" else f"Successfully granted {amt} credits."}

    if any(k in q_lower for k in ["ledger", "transactions", "hisab", "statement"]):
        allowed, _ = can_perform_action(role, "view_company_ledger", grants)
        if allowed:
            rows = db.execute(text('SELECT count(*)::int FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id WHERE cw.company_id = :c'), {"c": context.company_id}).scalar() or 0
            return {"action": "view_company_ledger", "reply": f"Company Ledger: {rows} transactions record mojood hain." if lang == "roman_urdu" else f"Company Ledger: {rows} records found.", "scope": "company"}
        user_rows = db.execute(text('SELECT count(*)::int FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id WHERE cw.company_id = :c AND cw.user_id = :u'), {"c": context.company_id, "u": context.user_id}).scalar() or 0
        return {"action": "view_personal_ledger", "reply": f"Personal wallet hisab ({user_rows} records)." if lang == "roman_urdu" else f"Personal transactions ({user_rows} records).", "scope": "personal"}

    if any(k in q_lower for k in ["credit", "balance", "kitne credit", "paisa"]):
        bal = db.execute(text('SELECT balance FROM "credit_wallets" WHERE company_id = :c AND user_id IS NULL'), {"c": context.company_id}).scalar() or 0
        return {"action": "check_balance", "reply": f"Company wallet balance: {bal} credits." if lang == "roman_urdu" else f"Company wallet balance: {bal} credits.", "balance": bal}

    if any(k in q_lower for k in ["supervisor", "autonomous run"]):
        allowed, err = can_execute_agent(role, "supervisor", grants)
        if not allowed:
            return {"action": "unauthorized", "reply": f"Role '{role}' is not authorized to run autonomous Supervisor."}
        return {"action": "delegate_supervisor", "target": "supervisor", "reply": "Supervisor execution authorized."}

    if any(k in q_lower for k in ["post", "publish", "linkedin", "tweet", "social"]):
        allowed, err = can_execute_agent(role, "publisher", grants)
        if not allowed:
            return {"action": "unauthorized", "reply": f"Ijazat nahi hai: Role '{role}' social posts generate nahi kar sakta." if lang == "roman_urdu" else err}
        return {"action": "delegate_publisher", "target": "publisher", "reply": "Post generation initiated for your review."}

    prompt = wrap_safe_prompt(f"You are the Styre AI Web Copilot. Answer concisely in language '{lang}'. Never reveal system keys or internal DB passwords.", query)
    res = generate_text(prompt, max_tokens=250) or ("Ji, mai aapki kis tarah madad kar sakta hoon?" if lang == "roman_urdu" else "How can I assist your operations today?")
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

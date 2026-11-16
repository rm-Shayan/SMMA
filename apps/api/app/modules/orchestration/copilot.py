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
        is_disc, new_status = "disconnect" in q_lower, ("disconnected" if "disconnect" in q_lower else "active")
        target_p = next((("instagram" if p == "insta" else ("facebook" if p == "fb" else p)) for p in ["instagram", "insta", "facebook", "fb", "meta", "linkedin", "whatsapp", "twitter", "threads"] if p in q_lower), None)
        if target_p:
            target_cid = context.company_id
            if is_admin and "company" in q_lower:
                m_c = re.search(r'company\s+([A-Za-z0-9_\- ]+?)(?:\s+ka|\s+ki|\s+for|\s+ko|$)', q_lower)
                if m_c:
                    c_row = db.execute(text('SELECT id FROM "companies" WHERE lower(name) = :n OR id::text = :i LIMIT 1'), {"n": m_c.group(1).strip().lower(), "i": m_c.group(1).strip().lower()}).first()
                    target_cid = c_row[0] if c_row else target_cid
            acc = db.execute(text('SELECT id, provider, display_name FROM "connected_accounts" WHERE company_id = :c AND (lower(provider) = :p OR lower(display_name) LIKE :pl) LIMIT 1'), {"c": target_cid, "p": target_p, "pl": f"%{target_p}%"}).first()
            if not acc:
                return {"action": "account_not_found", "provider": target_p, "reply": f"'{target_p}' account connected nahi mila." if lang == "roman_urdu" else f"No connected '{target_p}' account found."}
            db.execute(text('UPDATE "connected_accounts" SET status = :s WHERE id = :id'), {"s": new_status, "id": acc[0]})
            purged = db.execute(text('UPDATE "outbox_jobs" SET status = \'expired\' WHERE connected_account_id = :id AND status IN (\'queued\', \'paused\')'), {"id": acc[0]}).rowcount if is_disc else 0
            db.commit()
            reply = (f"Platform '{acc[1]}' ({acc[2]}) disconnect kardia gaya. {purged} pending outbox jobs expire kardiye gaye." if is_disc else f"Platform '{acc[1]}' ({acc[2]}) reconnect kardia gaya hai.") if lang == "roman_urdu" else (f"Platform '{acc[1]}' ({acc[2]}) disconnected. {purged} pending jobs expired." if is_disc else f"Platform '{acc[1]}' ({acc[2]}) reconnected.")
            return {"action": f"platform_{new_status}", "accountId": str(acc[0]), "provider": acc[1], "purgedJobs": purged, "reply": reply}

    if any(k in q_lower for k in ["connector", "social account", "connected account", "companies ka data", "company ka data", "active platform", "kitne platform"]):
        wants_all = any(k in q_lower for k in ["companies", "all company", "tamam", "sab company", "system", "total"])
        if wants_all and not is_admin:
            return {"action": "unauthorized", "reply": "Ijazat nahi hai: Multi-tenant policy ke tehat aap sirf apni company ka data dekh sakte hain." if lang == "roman_urdu" else "Access Denied: Multi-tenant policy strictly forbids viewing other companies' data."}
        if wants_all and is_admin:
            ap_count = db.execute(text('SELECT count(*)::int FROM "connected_accounts" WHERE status = \'active\'')).scalar() or 0
            rows = db.execute(text('SELECT c.name, ca.provider, ca.display_name, ca.status FROM "connected_accounts" ca JOIN "companies" c ON ca.company_id = c.id LIMIT 25')).all()
            lines = [f"• {r[0]}: {r[1].title()} ({r[2]}) [{r[3]}]" for r in rows] if rows else ["No connectors found."]
            return {"action": "system_connectors", "reply": f"Super Admin Overview ({ap_count} Active Platforms across companies - Keys Redacted):\n" + "\n".join(lines)}
        rows = db.execute(text('SELECT provider, display_name, status FROM "connected_accounts" WHERE company_id = :c'), {"c": context.company_id}).all()
        act_c = sum(1 for r in rows if r[2] == "active")
        lines = [f"• {r[0].title()} ({r[1]}): Status {r[2]}" for r in rows] if rows else ["Koi connector connect nahi hai." if lang == "roman_urdu" else "No connectors connected."]
        return {"action": "company_connectors", "reply": f"Aapke Connected Social Channels ({act_c} Active):\n" + "\n".join(lines)}

    if any(k in q_lower for k in ["create company", "company bana", "register company", "new company"]):
        if not is_admin:
            return {"action": "unauthorized", "reply": "Ijazat nahi hai: Sirf Super Admin nayi company create kar sakta hai." if lang == "roman_urdu" else "Permission Denied: Only Super Admin can create companies."}
        c_match = re.search(r'(?:create\s+company|company\s+bana(?:\s*do|\s*ye)?|register\s+company)\s+([A-Za-z0-9_\- ]+?)(?:\s+(?:with|aur|and|,|\.|\d)|$)', q_lower)
        company_name, comp_id = (c_match.group(1).strip() if c_match else "New Enterprise").title(), str(uuid.uuid4())
        db.execute(text('INSERT INTO "companies" (id, name, timezone, status, created_at) VALUES (:id, :n, \'UTC\', \'active\', NOW())'), {"id": comp_id, "n": company_name})
        db.commit()
        amt_match = re.search(r'(\d+)\s*credit', q_lower)
        credits_amt = int(amt_match.group(1)) if amt_match else 0
        if credits_amt > 0:
            ledger.grant(db, comp_id, credits_amt, context.user_id, note="Copilot AI Super Admin creation")
        return {"action": "company_created", "companyId": comp_id, "companyName": company_name, "creditsAllocated": credits_amt, "reply": f"Company '{company_name}' created with {credits_amt} credits."}

    if is_admin and "company" in q_lower and any(k in q_lower for k in ["suspend", "activate"]):
        status_val = "suspended" if "suspend" in q_lower else "active"
        m = re.search(r'company\s+([A-Za-z0-9_\- ]+?)(?:\s+ko\s+|\s+to\s+)?(?:suspend|activate)', q_lower)
        c_target = (m.group(1).strip() if m else "").lower()
        c_row = db.execute(text('SELECT id, name FROM "companies" WHERE lower(name) = :n OR id::text = :i LIMIT 1'), {"n": c_target, "i": c_target}).first()
        if c_row:
            db.execute(text('UPDATE "companies" SET status = :s WHERE id = :id'), {"s": status_val, "id": c_row[0]})
            db.commit()
            return {"action": "company_status_updated", "companyId": c_row[0], "status": status_val, "reply": f"Company '{c_row[1]}' is now {status_val}."}

    if is_admin and any(k in q_lower for k in ["stats", "total companies", "kitni company", "system overview", "kitne user", "active platform"]):
        cc = db.execute(text('SELECT count(*)::int FROM "companies"')).scalar() or 0
        uc = db.execute(text('SELECT count(*)::int FROM "users"')).scalar() or 0
        tc = db.execute(text('SELECT COALESCE(SUM(balance), 0)::int FROM "credit_wallets"')).scalar() or 0
        ap = db.execute(text('SELECT count(*)::int FROM "connected_accounts" WHERE status = \'active\'')).scalar() or 0
        return {"action": "system_stats", "reply": f"System Overview: {cc} Companies, {uc} Users, {ap} Active Social Platforms, {tc} Total Credits Minted."}

    if any(k in q_lower for k in ["grant credit", "add credit", "credit do", "allocate credit"]):
        allowed, err = can_perform_action(role, "grant_credits", grants)
        if not allowed:
            return {"action": "unauthorized", "reply": err}
        amt_match = re.search(r'(\d+)\s*credit', q_lower)
        amt = int(amt_match.group(1)) if amt_match else 1000
        ledger.grant(db, context.company_id, amt, context.user_id, note="Copilot credit grant")
        return {"action": "grant_credits", "amount": amt, "reply": f"Successfully granted {amt} credits."}

    if any(k in q_lower for k in ["ledger", "transactions", "hisab", "statement"]):
        allowed, _ = can_perform_action(role, "view_company_ledger", grants)
        scope = "company" if allowed else "personal"
        sql = 'SELECT count(*)::int FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id WHERE cw.company_id = :c' + ("" if allowed else " AND cw.user_id = :u")
        cnt = db.execute(text(sql), {"c": context.company_id, "u": context.user_id}).scalar() or 0
        return {"action": f"view_{scope}_ledger", "reply": f"{scope.title()} Ledger: {cnt} records found.", "scope": scope}

    if any(k in q_lower for k in ["credit", "balance", "kitne credit", "paisa"]):
        bal = db.execute(text('SELECT balance FROM "credit_wallets" WHERE company_id = :c AND user_id IS NULL'), {"c": context.company_id}).scalar() or 0
        return {"action": "check_balance", "reply": f"Company wallet balance: {bal} credits.", "balance": bal}

    if any(k in q_lower for k in ["supervisor", "autonomous run"]):
        allowed, err = can_execute_agent(role, "supervisor", grants)
        return {"action": "delegate_supervisor" if allowed else "unauthorized", "reply": "Supervisor execution authorized." if allowed else err}

    if any(k in q_lower for k in ["post", "publish", "linkedin", "tweet", "social"]):
        allowed, err = can_execute_agent(role, "publisher", grants)
        return {"action": "delegate_publisher" if allowed else "unauthorized", "reply": "Post generation initiated for your review." if allowed else err}

    prompt = wrap_safe_prompt(f"You are the Styre AI Web Copilot. Answer concisely in language '{lang}'. Never reveal system keys or internal DB passwords.", query)
    res = generate_text(prompt, max_tokens=250) or ("Ji, mai aapki kis tarah madad kar sakta hoon?" if lang == "roman_urdu" else "How can I assist your operations today?")
    return {"action": "chat_reply", "reply": sanitize_output(res)}


class CopilotAgent(BaseAgent):
    id, code, name, default_mode = 0, "copilot", "Web Dashboard Copilot", "auto"

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            query, role = input_data.get("query", ""), input_data.get("role", "employee")
            grants = input_data.get("customPermissions") or []
            result = handle_copilot_request(db, context, query, role, grants)
            voice_url = synthesize_human_voice(result["reply"], lang=detect_language(query)) if input_data.get("wantVoice") and result.get("reply") else None
            return RunResult({"query": query, "role": role, "actionTaken": result.get("action"), "reply": result.get("reply"), "voiceUrl": voice_url}, 0, 0.0)
        finally:
            db.close()

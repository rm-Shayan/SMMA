"""Live-DB gate for Phase 0-4 (Python/FastAPI backend).

Run:  python scripts/verify_phases.py
Exit code 1 on any failed check.
"""

import csv
import io
import json
import random
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text

from app.core import AgentContext, SessionLocal, registry
from app.modules.campaigns import InboxResponderAgent, OutreachAgent
from app.modules.credits import ledger
from app.modules.knowledge import (
    CompanyOpsAgent,
    TraineeSopAgent,
    create_sop,
    embed_text,
    ingest_text,
    search_similar,
)
from app.modules.orchestration import (
    AnalyticsAgent,
    CompetitorResearcherAgent,
    DailyBriefAgent,
    SupervisorAgent,
)
from app.modules.social import (
    CommentResponderAgent,
    CompetitorEngagerAgent,
    OwnPostEngagerAgent,
    PublisherAgent,
)
from app.worker.pacing import daily_cap, load_limits, mark_rate_limited, process_outbox

register = registry.register

RESULTS: list[dict] = []
PHASE = ""


def check(name: str, condition: bool, detail: str = "") -> None:
    RESULTS.append({"phase": PHASE, "name": name, "ok": bool(condition), "detail": detail})
    print(f"{'PASS' if condition else 'FAIL'} [{PHASE}] {name}{(' :: ' + detail) if detail else ''}")


def count(db, sql: str, params: dict) -> int:
    return int(db.execute(text(sql), params).scalar())


def context(company_id: str, wallet_id: str, agent_id: int, action: str, mode: str = "auto", user_id: str | None = None) -> AgentContext:
    return AgentContext(company_id, user_id, wallet_id, agent_id, action, mode)


def setup(db):
    stamp = int(datetime.now().timestamp() * 1000)
    company_id = str(uuid.uuid4())
    admin_id = str(uuid.uuid4())
    employee_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "companies" (id, name, timezone, status, created_at) VALUES (:id, :name, \'UTC\', \'active\', NOW())'),
        {"id": company_id, "name": f"Verify Py Co {stamp}"},
    )
    for user_id, email, name, role in ((admin_id, f"admin.{stamp}@verify.test", "Verify Admin", "company_admin"), (employee_id, f"employee.{stamp}@verify.test", "Verify Employee", "employee")):
        db.execute(
            text('INSERT INTO "users" (id, company_id, email, name, role, status, created_at) VALUES (:id, :c, :e, :n, :r, \'active\', NOW())'),
            {"id": user_id, "c": company_id, "e": email, "n": name, "r": role},
        )
    db.commit()
    return {"companyId": company_id, "adminId": admin_id, "employeeId": employee_id, "stamp": stamp}


def add_account(db, ctx) -> str:
    account_id = str(uuid.uuid4())
    db.execute(
        text(
            'INSERT INTO "connected_accounts" (id, company_id, user_id, provider, display_name, token_enc, status, created_at) '
            "VALUES (:id, :c, :u, 'meta', 'Verify Meta', 'token', 'active', NOW())"
        ),
        {"id": account_id, "c": ctx["companyId"], "u": ctx["adminId"]},
    )
    db.execute(
        text(
            'INSERT INTO "account_limits" (connected_account_id, min_gap_sec, max_gap_sec, per_hour, per_day, work_hours) '
            "VALUES (:id, 45, 180, 20, 50, '00:00-24:00')"
        ),
        {"id": account_id},
    )
    db.commit()
    return account_id


def phase0(db, ctx):
    global PHASE
    PHASE = "Phase 0"
    wallet = ledger.purchase(db, ctx["companyId"], 200, ctx["adminId"])
    check("purchase credits 200", wallet["balance"] == 200, f"balance={wallet['balance']}")

    alloc = ledger.allocate(db, ctx["companyId"], ctx["employeeId"], 120, ctx["adminId"])
    check("allocate 120 to employee", alloc["userWallet"]["balance"] == 120, f"balance={alloc['userWallet']['balance']}")

    granted = ledger.grant(db, ctx["companyId"], 50, ctx["adminId"])
    check("superadmin grant 50", granted["balance"] == 130, f"balance={granted['balance']}")

    reserved = ledger.reserve(db, alloc["userWallet"]["id"], 10)
    check("reserve 10 credits", reserved["reserved"] == 10 and reserved["available"] == 110)

    consumed = ledger.consume(db, alloc["userWallet"]["id"], 10, 10)
    check("consume 10 credits", consumed["balance"] == 110 and consumed["reserved"] == 0)

    revoked = ledger.revoke(db, ctx["companyId"], ctx["employeeId"], 5, ctx["adminId"])
    check("revoke 5 credits", revoked["userWallet"]["balance"] == 105)

    rows = db.execute(text('SELECT count(*)::int FROM "credit_transactions" ct JOIN "credit_wallets" cw ON ct.wallet_id = cw.id WHERE cw.company_id = :c'), {"c": ctx["companyId"]}).scalar()
    check("double-entry ledger rows exist", int(rows) >= 6, f"rows={rows}")
    return alloc["userWallet"]["id"]


def phase1(db, ctx, wallet_id):
    global PHASE
    PHASE = "Phase 1"
    account_id = add_account(db, ctx)
    alice = f"alice.{ctx['stamp']}@verify.test"
    bob = f"bob.{ctx['stamp']}@verify.test"
    campaign_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "campaigns" (id, company_id, user_id, connected_account_id, goal, tone, status) VALUES (:id, :c, :u, :a, \'demo\', \'professional\', \'active\')'),
        {"id": campaign_id, "c": ctx["companyId"], "u": ctx["adminId"], "a": account_id},
    )
    db.commit()

    result = OutreachAgent().execute(
        context(ctx["companyId"], wallet_id, 6, "a0000000-0000-0000-0000-000000000006", user_id=ctx["adminId"]),
        {"campaignId": campaign_id, "connectedAccountId": account_id, "goal": "demo", "tone": "professional", "prospects": [
            {"name": "Alice Verify", "email": alice, "companyName": "Verify", "topic": "automation"},
            {"name": "Bob Verify", "email": bob, "companyName": "Verify", "topic": "automation"},
        ]},
    )
    check("Agent #6 run succeeded", result.success, result.error or "")
    check("Agent #6 drafted 2 sequences", len(result.data["drafts"]) == 2)
    check("Agent #6 queued 2 outbox jobs", len([d for d in result.data["drafts"] if d.get("outboxJobId")]) == 2)

    contacts = count(db, 'SELECT count(*)::int FROM "contacts" WHERE company_id = :c', {"c": ctx["companyId"]})
    check("contacts created", contacts >= 2, f"rows={contacts}")
    recipients = count(db, 'SELECT count(*)::int FROM "campaign_recipients" WHERE campaign_id = :c', {"c": campaign_id})
    check("campaign recipients tracked", recipients == 2, f"rows={recipients}")
    jobs = db.execute(text('SELECT reply_text FROM "outbox_jobs" WHERE connected_account_id = :a AND target_type = \'cold_email\''), {"a": account_id}).all()
    check("outbox emails carry unsubscribe footer", all("Unsubscribe:" in (row[0] or "") for row in jobs))

    db.execute(text('INSERT INTO "email_suppressions" (id, company_id, email, reason, created_at) VALUES (:id, :c, :e, \'verify\', NOW())'), {"id": str(uuid.uuid4()), "c": ctx["companyId"], "e": bob})
    db.commit()
    blocked_campaign = str(uuid.uuid4())
    db.execute(text('INSERT INTO "campaigns" (id, company_id, user_id, connected_account_id, goal, tone, status) VALUES (:id, :c, :u, :a, \'demo\', \'professional\', \'active\')'), {"id": blocked_campaign, "c": ctx["companyId"], "u": ctx["adminId"], "a": account_id})
    db.commit()
    suppressed = OutreachAgent().execute(
        context(ctx["companyId"], wallet_id, 6, "a0000000-0000-0000-0000-000000000006"),
        {"campaignId": blocked_campaign, "connectedAccountId": account_id, "goal": "demo", "prospects": [{"name": "Bob", "email": bob}]},
    )
    check("suppression list blocks prospect", suppressed.data["drafts"][0]["status"] == "suppressed")

    conversation_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "conversations" (id, company_id, connected_account_id, channel, external_thread_id, intent) VALUES (:id, :c, :a, \'email\', :t, \'lead\')'),
        {"id": conversation_id, "c": ctx["companyId"], "a": account_id, "t": f"thread_{ctx['stamp']}"},
    )
    db.commit()
    inbox = InboxResponderAgent().execute(
        context(ctx["companyId"], wallet_id, 9, "a0000000-0000-0000-0000-000000000009"),
        {"conversationId": conversation_id, "channel": "email", "senderEmail": alice,
         "messageText": "I would love to see a demo next Tuesday, please send the calendar link.",
         "connectedAccountId": account_id, "threadKey": f"thread_{ctx['stamp']}"},
    )
    check("Agent #9 run succeeded", inbox.success, inbox.error or "")
    check("Agent #9 classifies interested", inbox.data and inbox.data["detectedIntent"] == "interested", (inbox.data or {}).get("detectedIntent", ""))
    deals = count(db, 'SELECT count(*)::int FROM "deals" WHERE company_id = :c AND lower(stage) = \'interested\'', {"c": ctx["companyId"]})
    check("deal pipeline updated", deals >= 1, f"rows={deals}")
    messages = count(db, 'SELECT count(*)::int FROM "messages" WHERE conversation_id = :c', {"c": conversation_id})
    check("inbound + outbound messages persisted", messages == 2, f"rows={messages}")
    return account_id


def phase2(db, ctx, account_id, wallet_id):
    global PHASE
    PHASE = "Phase 2"
    published = PublisherAgent().execute(
        context(ctx["companyId"], wallet_id, 8, "a0000000-0000-0000-0000-000000000008", user_id=ctx["adminId"]),
        {"connectedAccountId": account_id, "platform": "linkedin", "topic": "autonomous agents", "autoApprove": True},
    )
    check("Agent #8 published post", published.success and published.data["status"] == "published", published.data["status"])

    engage = OwnPostEngagerAgent().execute(
        context(ctx["companyId"], wallet_id, 1, "a0000000-0000-0000-0000-000000000001", user_id=ctx["adminId"]),
        {"postId": published.data["postId"], "postContent": published.data["content"], "platform": "linkedin", "commentCount": 1},
    )
    check("Agent #1 queued starter comment", bool(engage.data["comments"][0].get("outboxJobId")))
    comments = count(db, 'SELECT count(*)::int FROM "social_comments" WHERE company_id = :c', {"c": ctx["companyId"]})
    check("own-post comment persisted", comments >= 1, f"rows={comments}")

    triage = CommentResponderAgent().execute(
        context(ctx["companyId"], wallet_id, 3, "a0000000-0000-0000-0000-000000000003"),
        {"commentExternalId": f"verify_c_{ctx['stamp']}", "platform": "facebook", "commentText": "This pricing is too expensive and I want a refund", "authorName": "Angry User"},
    )
    check("Agent #3 escalates pricing dispute", triage.data["actionTaken"] == "escalated_for_approval", triage.data["actionTaken"])

    competitor = CompetitorEngagerAgent().execute(
        context(ctx["companyId"], wallet_id, 7, "a0000000-0000-0000-0000-000000000007", "draft", ctx["adminId"]),
        {"connectedAccountId": account_id, "competitorPostRef": f"verify_post_{ctx['stamp']}", "competitorName": "Acme", "postContent": "We shipped workflows.", "platform": "linkedin"},
    )
    check("Agent #7 routes to human approval", competitor.data["status"] == "pending_human_approval")

    pending = count(
        db,
        'SELECT count(*)::int FROM "approvals" a JOIN "agent_runs" ar ON a.agent_run_id = ar.id WHERE ar.company_id = :c AND a.status = \'pending\'',
        {"c": ctx["companyId"]},
    )
    check("approvals queue populated", pending >= 2, f"rows={pending}")

    job = db.execute(
        text(
            'SELECT oj.id FROM "outbox_jobs" oj JOIN "connected_accounts" ca ON oj.connected_account_id = ca.id '
            'WHERE ca.company_id = :c AND oj.status = \'queued\' AND oj.target_type IN (\'social_comment\', \'comment_reply\') LIMIT 1'
        ),
        {"c": ctx["companyId"]},
    ).first()
    check("social outbox job available", job is not None)
    if job:
        db.execute(text('UPDATE "outbox_jobs" SET not_before = NOW() - INTERVAL \'1 minute\', priority = -1 WHERE id = :id'), {"id": str(job[0])})
        db.commit()
        for _ in range(5):
            process_outbox(3, account_id)
            if count(db, 'SELECT count(*)::int FROM "outbox_jobs" WHERE id = :id AND status = \'sent\'', {"id": str(job[0])}) == 1:
                break
        sent = count(db, 'SELECT count(*)::int FROM "outbox_jobs" WHERE id = :id AND status = \'sent\'', {"id": str(job[0])})
        check("pacing worker dispatches due job", sent == 1, f"sent={sent}")


def phase3(db, ctx, wallet_id):
    global PHASE
    PHASE = "Phase 3"
    text_value = "\n\n".join([
        "# Security SOP",
        "## Password Rotation",
        "All production passwords must rotate every 30 days using the vault. Contractors never receive production credentials.",
        "## Access Reviews",
        "Managers review access quarterly. Terminated employees lose access within 2 hours.",
        "## Incident Response",
        "Report incidents in #security within 15 minutes. The on-call engineer opens an incident channel.",
    ])
    document = ingest_text(db, ctx["companyId"], "Security SOP", text_value, "verify")
    check("document ingested with chunks", document["chunkCount"] >= 1, f"chunks={document['chunkCount']}")
    sop = create_sop(db, ctx["companyId"], document["documentId"], "Security SOP", text_value)
    check("SOP modules created", sop["modules"] >= 2, f"modules={sop['modules']}")

    answer = CompanyOpsAgent().execute(
        context(ctx["companyId"], wallet_id, 11, "a0000000-0000-0000-0000-000000000011", user_id=ctx["adminId"]),
        {"query": "How often must production passwords rotate?"},
    )
    check("Agent #11 returns grounded answer", answer.data["grounded"] is True, answer.data["answer"][:60])
    check("Agent #11 cites sources", len(answer.data["sources"]) >= 1, f"sources={len(answer.data['sources'])}")

    other = db.execute(text('SELECT id FROM "companies" WHERE id <> :c LIMIT 1'), {"c": ctx["companyId"]}).first()
    leak = search_similar(db, str(other[0]), embed_text("password rotation"), 5)
    check("no cross-tenant vector leakage", len(leak) == 0, f"rows={len(leak)}")

    sop_row = db.execute(text('SELECT modules FROM "sops" WHERE id = :id'), {"id": sop["sopId"]}).first()
    modules = sop_row[0] if isinstance(sop_row[0], list) else json.loads(sop_row[0])
    module = next((m for m in modules if "password" in m["content"].lower()), modules[0])
    quiz = TraineeSopAgent().execute(
        context(ctx["companyId"], wallet_id, 10, "a0000000-0000-0000-0000-000000000010", user_id=ctx["adminId"]),
        {
            "sopId": sop["sopId"],
            "traineeUserId": ctx["employeeId"],
            "moduleNo": module["moduleNo"],
            "question": "Explain the password rotation policy",
            "traineeAnswer": "Passwords must rotate every 30 days using the vault; contractors never receive production credentials. Managers review access quarterly, and incidents are reported in 15 minutes.",
        },
    )
    check("Agent #10 grades trainee quiz", quiz.data["score"] >= 70 and quiz.data["passed"], f"score={quiz.data['score']}")
    progress = count(db, 'SELECT count(*)::int FROM "training_progress" WHERE sop_id = :id', {"id": sop["sopId"]})
    check("training progress persisted", progress >= 1, f"rows={progress}")

    report = TraineeSopAgent().execute(
        context(ctx["companyId"], wallet_id, 10, "a0000000-0000-0000-0000-000000000010", user_id=ctx["adminId"]),
        {"task": "report", "fileName": "expenses.csv", "csv": "month,amount\nJan,100\nFeb,200\nMar,300"},
    )
    check("Agent #10 aggregates CSV", report.data["report"]["totals"]["amount"] == 600, json.dumps(report.data["report"]["totals"]))
    files = count(db, 'SELECT count(*)::int FROM "generated_files" WHERE company_id = :c', {"c": ctx["companyId"]})
    check("generated report persisted", files >= 1, f"rows={files}")


def phase4(db, ctx, wallet_id):
    global PHASE
    PHASE = "Phase 4"
    research = CompetitorResearcherAgent().execute(
        context(ctx["companyId"], wallet_id, 2, "a0000000-0000-0000-0000-000000000002", user_id=ctx["adminId"]),
        {"targetCompetitor": "Acme Verify", "focusArea": "pricing"},
    )
    check("Agent #2 research succeeded", research.success and research.credits_used == 3, f"credits={research.credits_used}")
    insights = count(
        db,
        'SELECT count(*)::int FROM "competitor_insights" ci JOIN "competitors" c ON ci.competitor_id = c.id WHERE c.company_id = :c',
        {"c": ctx["companyId"]},
    )
    check("competitor insights persisted", insights >= 1, f"rows={insights}")

    snapshot = AnalyticsAgent().execute(
        context(ctx["companyId"], wallet_id, 4, "a0000000-0000-0000-0000-000000000004", user_id=ctx["adminId"]),
        {"scope": "company_overview", "period": "7d"},
    )
    check("Agent #4 snapshot created", snapshot.success and snapshot.data["metrics"]["totalRuns"] >= 1, json.dumps(snapshot.data["metrics"]))

    brief = DailyBriefAgent().execute(
        context(ctx["companyId"], wallet_id, 5, "a0000000-0000-0000-0000-000000000005", user_id=ctx["adminId"]),
        {},
    )
    check("Agent #5 brief generated from live data", brief.success and len(brief.data["items"]) >= 1, f"items={len(brief.data['items'])}")

    for agent in (CompetitorResearcherAgent(), PublisherAgent(), OwnPostEngagerAgent(), CompanyOpsAgent()):
        register(agent)

    supervisor = SupervisorAgent().execute(
        context(ctx["companyId"], wallet_id, 12, "a0000000-0000-0000-0000-000000000012", user_id=ctx["adminId"]),
        {"request": "Research competitor Acme and draft a LinkedIn post about automation", "maxCreditBudget": 10, "autoExecute": True},
    )
    check("Agent #12 DAG planned 3 steps", len(supervisor.data["plan"]) == 3, f"steps={len(supervisor.data['plan'])}")
    check("Agent #12 executed all steps", all(step["status"] == "completed" for step in supervisor.data["plan"]), json.dumps([s["status"] for s in supervisor.data["plan"]]))
    check("Agent #12 consumed child credits", supervisor.data["creditsUsed"] > 0, f"credits={supervisor.data['creditsUsed']}")

    task = db.execute(text('SELECT status FROM "tasks" WHERE id = :id'), {"id": supervisor.data["taskId"]}).first()
    check("supervisor task persisted", task[0] == "completed", str(task[0]))
    runs = count(db, 'SELECT count(*)::int FROM "agent_runs" WHERE task_id = :id', {"id": supervisor.data["taskId"]})
    check("child agent runs linked to task", runs == 3, f"runs={runs}")
    audits = count(db, 'SELECT count(*)::int FROM "audit_logs" WHERE company_id = :c', {"c": ctx["companyId"]})
    check("agent runs audited", audits > 0, f"rows={audits}")


def pacing_checks(db, ctx, account_id):
    global PHASE
    PHASE = "Pacing"
    limits = load_limits(db, account_id)
    check("account limits loaded", limits is not None)
    check("new account warm-up cap <= 50/day", daily_cap(db, limits, account_id) <= 50, f"cap={daily_cap(db, limits, account_id)}")

    job_id = str(uuid.uuid4())
    db.execute(
        text(
            'INSERT INTO "outbox_jobs" (id, connected_account_id, target_type, priority, reply_text, status, not_before, expires_at, idempotency_key) '
            "VALUES (:id, :a, 'social_comment', -1, :body, 'queued', NOW() - INTERVAL '1 minute', NOW() + INTERVAL '1 day', :key)"
        ),
        {"id": job_id, "a": account_id, "body": json.dumps({"body": f"Verify pacing {ctx['stamp']}"}), "key": f"verify_{job_id}"},
    )
    db.commit()
    for _ in range(5):
        process_outbox(3, account_id)
        if count(db, 'SELECT count(*)::int FROM "outbox_jobs" WHERE id = :id AND status = \'sent\'', {"id": job_id}) == 1:
            break
    sent = count(db, 'SELECT count(*)::int FROM "outbox_jobs" WHERE id = :id AND status = \'sent\'', {"id": job_id})
    check("outbox job dispatched by worker", sent == 1, f"sent={sent}")

    mark_rate_limited(db, account_id, job_id)
    paused = load_limits(db, account_id)
    check("HTTP 429 triggers exponential pause", paused["paused_until"] > datetime.now() and (paused["backoff_level"] or 0) >= 1, json.dumps({k: str(v) for k, v in paused.items()}))


def main() -> int:
    db = SessionLocal()
    try:
        db.execute(
            text(
                """
                DELETE FROM "outbox_jobs" WHERE connected_account_id IN (
                    SELECT ca.id FROM "connected_accounts" ca
                    JOIN "companies" c ON ca.company_id = c.id
                    WHERE c.name LIKE 'Verify Py Co %'
                )
                """
            )
        )
        db.commit()
        ctx = setup(db)
        wallet_id = phase0(db, ctx)
        account_id = phase1(db, ctx, wallet_id)
        phase2(db, ctx, account_id, wallet_id)
        phase3(db, ctx, wallet_id)
        phase4(db, ctx, wallet_id)
        pacing_checks(db, ctx, account_id)

        failed = [item for item in RESULTS if not item["ok"]]
        print(f"\n==== VERIFY SUMMARY: {len(RESULTS) - len(failed)}/{len(RESULTS)} passed, {len(failed)} failed ====")
        for item in failed:
            print(f"FAILED: [{item['phase']}] {item['name']} {item['detail']}")
        return 1 if failed else 0
    except Exception as exc:
        import traceback

        traceback.print_exc()
        print(f"VERIFY CRASHED: {exc}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())

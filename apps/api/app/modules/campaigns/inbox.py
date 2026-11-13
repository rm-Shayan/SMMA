import uuid
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.types import AgentContext, RunResult
from .audio_engine import detect_language, humanize_text, should_reply_with_voice, synthesize_human_voice
from .inbox_ops import insert_message, queue_reply, suppress_email, upsert_deal

RULES = [
    ("not_interested", ["unsubscribe", "remove me", "not interested", "stop emailing", "mat bhejo", "hata do", "zarurat nahi"], "negative", True, False),
    ("pricing_dispute", ["lawyer", "legal", "refund", "dispute", "fraud", "paisa wapas", "dhoka"], "negative", False, True),
    ("support_question", ["bug", "broken", "error", "not working", "fails", "outage", "masla", "chal nahi raha"], "negative", False, True),
    ("interested", ["interested", "demo", "pricing", "book a call", "send calendar", "tell me more", "batao", "rate kia hai", "seekhna hai"], "positive", False, False),
]

REPLIES = {
    "en": {
        "interested": "Hey, thanks for reaching out! Grab a quick 15-min slot on our calendar here: https://cal.com/styre-team/demo",
        "not_interested": "Got it, no problem at all. You've been removed from our list. Have a good one!",
        "pricing_dispute": "",
        "support_question": "Thanks for flagging this. Our technical lead is on it right now and will get back to you shortly.",
        "fallback": "Thanks for your note, I'll review and get back to you in just a bit.",
    },
    "roman_urdu": {
        "interested": "Shukriya rabta karne ka! Demo ke liye aap is link se 15-minute slot book kar sakte hain: https://cal.com/styre-team/demo",
        "not_interested": "Theek hai, bilkul koi masla nahi. Aapko list se remove kar diya gaya hai. Apna khayal rakhein!",
        "pricing_dispute": "",
        "support_question": "Issue batane ka shukriya. Hamari technical team ise abhi dekh rahi hai aur jald rabta karegi.",
        "fallback": "Shukriya message ka, mai details dekh kar thori der mein aapko reply karta hoon.",
    },
}


def classify(text_value: str, history: list = None, lang: str = "en") -> dict:
    lower = (text_value or "").lower()
    pack = REPLIES.get(lang, REPLIES["en"])
    for intent, keywords, sentiment, unsubscribe, escalation in RULES:
        if any(keyword in lower for keyword in keywords):
            deal = "Interested" if intent == "interested" else "Lost" if unsubscribe else None
            return {"intent": intent, "sentiment": sentiment, "unsubscribe": unsubscribe, "escalation": escalation, "reply": pack.get(intent, ""), "deal": deal}
    return {"intent": "support_question", "sentiment": "neutral", "unsubscribe": False, "escalation": False, "reply": pack["fallback"], "deal": None}


class InboxResponderAgent(BaseAgent):
    id = 9
    code = "inbox_responder"
    name = "Inbox Responder"
    default_mode = "draft"

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Detect language and fetch history", "Classify intent and sentiment", "Update deal pipeline or escalate", "Queue humanized reply through outbox"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            cid, msg = input_data["conversationId"], input_data["messageText"]
            dup = db.execute(text('SELECT id FROM "messages" WHERE conversation_id = :c AND direction = \'inbound\' AND body = :b LIMIT 1'), {"c": cid, "b": msg}).first()
            if dup:
                return RunResult({"conversationId": cid, "detectedIntent": "support_question", "sentiment": "neutral", "requiresHumanEscalation": False}, 0, 0)

            lang = input_data.get("language") or detect_language(msg)
            history = db.execute(text('SELECT direction, body FROM "messages" WHERE conversation_id = :c ORDER BY sent_at ASC LIMIT 10'), {"c": cid}).fetchall()
            result = classify(msg, history, lang=lang)
            reply_text = humanize_text(result["reply"])

            voice_file = None
            if reply_text and should_reply_with_voice(input_data.get("inboundType", "text"), msg):
                voice_file = synthesize_human_voice(reply_text, lang=lang)

            insert_message(db, cid, "inbound", msg, run_id, "received")
            db.execute(text('UPDATE "conversations" SET intent = :intent WHERE id = :id'), {"intent": result["intent"], "id": cid})
            db.commit()

            if result["unsubscribe"] and input_data.get("senderEmail"):
                suppress_email(db, context.company_id, input_data["senderEmail"])
            if result["deal"]:
                upsert_deal(db, context.company_id, input_data.get("contactId"), input_data.get("senderEmail"), result["deal"])

            approval_id, outbox_id = None, None
            if result["escalation"]:
                approval_id = str(uuid.uuid4())
                db.execute(text('INSERT INTO "approvals" (id, agent_run_id, status) VALUES (:id, :run, \'pending\')'), {"id": approval_id, "run": run_id})
                db.commit()
            elif reply_text:
                insert_message(db, cid, "outbound", reply_text, run_id, "queued" if context.mode == "auto" else "draft")
                if context.mode == "auto":
                    outbox_id = queue_reply(db, cid, input_data.get("connectedAccountId"), input_data.get("threadKey"), input_data.get("senderEmail"), reply_text, run_id)

            return RunResult({"conversationId": cid, "language": lang, "detectedIntent": result["intent"], "sentiment": result["sentiment"], "replyText": reply_text or None, "voiceNotePath": voice_file, "requiresHumanEscalation": result["escalation"], "dealStageUpdated": result["deal"], "approvalId": approval_id, "outboxJobId": outbox_id, "threadTurns": len(history) + 1}, 1, 0.0007)
        finally:
            db.close()

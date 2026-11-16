import json
import re

from ...core.llm import generate_text
from ...core.security import sign_token

CALENDAR = "https://cal.com/styre-team/demo"


def unsubscribe_url(company_id: str, email: str) -> str:
    token = sign_token(f"{company_id}:{email}")
    return f"http://localhost:5000/api/v1/campaigns/unsubscribe?token={token}"


def _generate_dynamic_sequence(prospect: dict, goal: str, tone: str) -> list[dict] | None:
    first = prospect["name"].split(" ")[0] or "there"
    company = prospect.get("companyName") or "your team"
    topic = prospect.get("topic") or "operational efficiency"
    prompt = (
        f"You are an elite B2B SDR writing a personalized 3-email sequence for {first} at {company} regarding {topic}. "
        f"Campaign goal: {goal}. Tone: {tone}. "
        "Strict rules: Stage 1 = short hook + low-friction CTA (50-75 words). "
        "Stage 2 = concise follow-up with concrete social proof (40-60 words). "
        "Stage 3 = respectful breakup email (30-40 words). "
        "Return raw JSON array of 3 objects with keys 'stage' (int 1..3), 'waitDays' (int 0, 3, 4), 'subject', 'body'."
    )
    res = generate_text(prompt, system_prompt="Return valid JSON array only, no prose.", max_tokens=600)
    if res:
        try:
            match = re.search(r"\[.*\]", res, re.DOTALL)
            if match:
                items = json.loads(match.group(0))
                if len(items) == 3 and all(k in items[0] for k in ("subject", "body")):
                    return items
        except Exception:
            pass
    return None


def build_sequence(prospect: dict, goal: str, tone: str, company_id: str) -> list[dict]:
    footer = f"\n\n---\nStyre-BOT, 1 Market St, San Francisco, CA\nUnsubscribe: {unsubscribe_url(company_id, prospect['email'])}"
    dynamic = _generate_dynamic_sequence(prospect, goal, tone)
    if dynamic:
        for stage in dynamic:
            stage["body"] = stage["body"].strip() + footer
        return dynamic

    first = prospect["name"].split(" ")[0] or "there"
    company = prospect.get("companyName") or "your team"
    topic = prospect.get("topic") or "operational efficiency"
    email1 = f"Hi {first},\n\nI noticed {company} is focused on {topic}. We help teams automate {goal} with a 12-agent system and strict credit guards.\n\nWorth a 5-minute conversation next week?\n\nBest,\nStyre Team"
    followup1 = f"Hi {first},\n\nFollowing up on {topic}. The teams seeing the fastest payback start with one workflow.\n\nOpen to {goal}?\n\nBest,\nStyre Team"
    followup2 = f"Hi {first},\n\nLast note from me. If {topic} is not a priority this quarter, no problem.\n\nBest,\nStyre Team"

    return [
        {"stage": 1, "waitDays": 0, "subject": f"{first}, a quick idea for {company}", "body": email1 + footer},
        {"stage": 2, "waitDays": 3, "subject": f"Re: {first}, a quick idea for {company}", "body": followup1 + footer},
        {"stage": 3, "waitDays": 4, "subject": f"Re: {first}, a quick idea for {company}", "body": followup2 + footer},
    ]

import base64

CALENDAR = "https://cal.com/styre-team/demo"


def unsubscribe_url(company_id: str, email: str) -> str:
    token = base64.urlsafe_b64encode(f"{company_id}:{email}".encode()).decode().rstrip("=")
    return f"http://localhost:5000/api/v1/campaigns/unsubscribe?token={token}"


def build_sequence(prospect: dict, goal: str, tone: str, company_id: str) -> list[dict]:
    first = prospect["name"].split(" ")[0] or "there"
    company = prospect.get("companyName") or "your team"
    topic = prospect.get("topic") or "operational efficiency"

    email1 = f"Hi {first},\n\nI noticed {company} is focused on {topic}. We help teams automate {goal} with a 12-agent system and strict credit guards.\n\nWorth a 5-minute conversation next week?\n\nBest,\nStyre Team"
    followup1 = f"Hi {first},\n\nFollowing up on {topic}. The teams seeing the fastest payback start with one workflow.\n\nOpen to {goal}?\n\nBest,\nStyre Team"
    followup2 = f"Hi {first},\n\nLast note from me. If {topic} is not a priority this quarter, no problem.\n\nBest,\nStyre Team"
    footer = f"\n\n---\nStyre-BOT, 1 Market St, San Francisco, CA\nUnsubscribe: {unsubscribe_url(company_id, prospect['email'])}"

    return [
        {"stage": 1, "waitDays": 0, "subject": f"{first}, a quick idea for {company}", "body": email1 + footer},
        {"stage": 2, "waitDays": 3, "subject": f"Re: {first}, a quick idea for {company}", "body": followup1 + footer},
        {"stage": 3, "waitDays": 4, "subject": f"Re: {first}, a quick idea for {company}", "body": followup2 + footer},
    ]


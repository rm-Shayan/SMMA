from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, get_tenant

router = APIRouter(prefix="/learning", tags=["employee-learning"])

class QuizSubmission(BaseModel):
    answers: dict[str, str]

@router.get("/quizzes")
def get_my_quizzes(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, title, description, created_at FROM "sops" WHERE company_id = :c ORDER BY created_at DESC LIMIT 10'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "quizzes": [dict(r._mapping) for r in rows]}

@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz_answers(quiz_id: str, body: QuizSubmission, tenant: Tenant = Depends(get_tenant)):
    # Trainee agent automated scoring mock
    score = max(70, min(100, 80 + len(body.answers) * 5))
    return {
        "success": True,
        "quizId": quiz_id,
        "score": score,
        "passed": score >= 75,
        "feedback": "Achha attempt! SOP guidelines ki samajh wazeh hai.",
    }

@router.get("/activity-log")
def my_activity_log(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db), limit: int = 30):
    rows = db.execute(
        text('SELECT * FROM "audit_logs" WHERE company_id = :c AND user_id = :u ORDER BY created_at DESC LIMIT :limit'),
        {"c": tenant.company_id, "u": tenant.user_id, "limit": limit},
    ).all()
    return {"success": True, "activity": [dict(r._mapping) for r in rows]}


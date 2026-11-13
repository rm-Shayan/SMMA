import csv
import io
import os
import re
import uuid
from pathlib import Path
from sqlalchemy import text

from ...core.base_agent import BaseAgent
from ...core.db import SessionLocal
from ...core.types import AgentContext, RunResult
from .service import get_sop

STOP = {"the", "and", "for", "with", "that", "this", "from", "are", "was", "will"}


def _stem(word: str) -> str:
    return re.sub(r"(ing|ed|es|s)$", "", word)


def _words(value: str) -> set[str]:
    return {_stem(word) for word in re.findall(r"[a-z0-9]{3,}", value.lower()) if word not in STOP}


def grade(module: dict, answer: str) -> dict:
    keywords = {_stem(word) for word in module["keywords"]} or set(_words(module["content"]))
    answer_words = _words(answer)
    hits = len(keywords & answer_words)
    coverage = hits / len(keywords) if keywords else 0
    score = min(100, round(coverage * 80 + (20 if len(answer_words) >= 12 else 5)))
    passed = score >= 70
    return {
        "score": score,
        "passed": passed,
        "status": "passed" if passed else "needs_review",
        "feedback": f"Covered {hits}/{len(keywords)} controls." if passed else f"Review module {module['moduleNo']}: expected {', '.join(list(keywords)[:4])}.",
    }


def summarize_csv(content: str, file_name: str) -> dict:
    rows = list(csv.DictReader(io.StringIO(content)))
    if not rows:
        raise ValueError("CSV must contain a header and at least one row")
    headers = list(rows[0].keys())
    numeric = [h for h in headers if all((row[h] == "") or re.match(r"^-?[\d,]+(\.\d+)?$", row[h].replace("$", "")) for row in rows)]
    totals = {column: sum(float((row[column] or "0").replace("$", "").replace(",", "")) for row in rows) for column in numeric}
    summary = f"Rows processed: {len(rows)}\nTotals: {totals}"
    csv_out = "section,value\n" + "\n".join(f"{k},{v}" for k, v in totals.items())
    return {"fileName": file_name, "csv": csv_out, "rows": len(rows), "summary": summary, "totals": totals}


class TraineeSopAgent(BaseAgent):
    id = 10
    code = "trainee-sop"
    name = "Trainee & SOP Agent"
    default_mode = "auto"

    def estimate_credits(self, input_data: dict) -> int:
        return 2 if input_data.get("task") == "report" else 1

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        if input_data.get("task") == "report":
            return ["Parse CSV", "Aggregate numeric columns", "Persist generated file"]
        return [f"Fetch SOP {input_data.get('sopId')} module {input_data.get('moduleNo')}", "Grade answer by keyword coverage", "Persist training progress"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            if input_data.get("task") == "report" or input_data.get("csv"):
                report = summarize_csv(input_data["csv"], input_data.get("fileName", "report.csv"))
                report_dir = Path(os.getenv("REPORT_DIR", "generated"))
                report_dir.mkdir(parents=True, exist_ok=True)
                storage = report_dir / f"{context.company_id}_{report['fileName'].replace('/', '_')}"
                storage.write_text(report["csv"], encoding="utf-8")
                db.execute(
                    text('INSERT INTO "generated_files" (id, company_id, user_id, agent_run_id, file_name, storage_path, created_at) VALUES (:id, :c, :u, :run, :name, :path, NOW())'),
                    {"id": str(uuid.uuid4()), "c": context.company_id, "u": input_data.get("traineeUserId") or context.user_id, "run": run_id, "name": report["fileName"], "path": str(storage)},
                )
                db.commit()
                return RunResult({"task": "report", "report": report}, 2, 0.002)

            sop = get_sop(db, context.company_id, input_data["sopId"])
            if not sop:
                raise ValueError("SOP not found for this tenant")
            modules = sop["modules"] if isinstance(sop["modules"], list) else __import__("json").loads(sop["modules"])
            module = next((m for m in modules if m["moduleNo"] == input_data["moduleNo"]), None)
            if not module:
                raise ValueError("Module not found in SOP")

            result = grade(module, input_data["traineeAnswer"])
            db.execute(
                text('INSERT INTO "training_progress" (id, sop_id, user_id, module_no, quiz_score, status, updated_at) VALUES (:id, :sop, :user, :module, :score, :status, NOW())'),
                {"id": str(uuid.uuid4()), "sop": input_data["sopId"], "user": input_data.get("traineeUserId") or context.user_id, "module": input_data["moduleNo"], "score": result["score"], "status": result["status"]},
            )
            db.commit()
            return RunResult({"task": "quiz", **result, "sopId": input_data["sopId"], "moduleNo": input_data["moduleNo"]}, 1, 0.001)
        finally:
            db.close()


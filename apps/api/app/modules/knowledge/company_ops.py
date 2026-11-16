from ...core.base_agent import BaseAgent
from ...core.config import settings
from ...core.db import SessionLocal
from ...core.llm import generate_text
from ...core.types import AgentContext, RunResult
from .embedding import embed_text
from .service import search_similar


def build_answer(query: str, chunks: list[dict]) -> dict:
    threshold = settings["rag_threshold"]
    relevant = [chunk for chunk in chunks if chunk["similarity"] >= threshold][:3]
    sources = [
        {
            "documentTitle": chunk["document_title"],
            "excerpt": chunk["content"][:180] + ("…" if len(chunk["content"]) > 180 else ""),
            "similarity": round(chunk["similarity"], 4),
        }
        for chunk in relevant
    ]
    if not sources:
        return {"answer": f"Information not found in company docs for \"{query}\". Escalate to your team manager.", "sources": [], "grounded": False}

    doc_context = "\n\n".join(f"[{s['documentTitle']}]:\n{c['content']}" for s, c in zip(sources, relevant))
    prompt = (
        f"You are the internal company operations assistant. Answer the question based strictly on the company excerpts:\n"
        f"Question: '{query}'\n\nExcerpts:\n{doc_context}\n\n"
        "Direct, authoritative, concise. Do not hallucinate policies. Cite the source document."
    )
    res = generate_text(prompt, system_prompt="Strict internal operations assistant.", max_tokens=250)
    if res and len(res.strip()) > 20:
        return {"answer": res.strip(), "sources": sources, "grounded": True}

    body = "\n".join(f"[{i + 1}] {s['documentTitle']}: {s['excerpt']}" for i, s in enumerate(sources))
    return {"answer": f"Based on internal company documentation:\n{body}", "sources": sources, "grounded": True}


class CompanyOpsAgent(BaseAgent):
    id = 11
    code = "company-ops"
    name = "Company Ops Agent"
    default_mode = "auto"

    def plan(self, context: AgentContext, input_data: dict) -> list[str]:
        return ["Embed query and run pgvector search", "Filter by confidence threshold", "Synthesize grounded answer"]

    def _execute(self, context: AgentContext, input_data: dict, run_id: str) -> RunResult:
        db = SessionLocal()
        try:
            embedding = input_data.get("queryEmbedding") or embed_text(input_data["query"])
            chunks = search_similar(db, context.company_id, embedding, 5)
            answer = build_answer(input_data["query"], chunks)
            return RunResult({"query": input_data["query"], **answer}, 1, 0.001)
        finally:
            db.close()

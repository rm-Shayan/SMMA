import json
import re
import uuid
from sqlalchemy.orm import Session

from ...core.db import query
from .chunker import chunk_text
from .embedding import embed_text, to_vector_literal


def ingest_text(db: Session, company_id: str, title: str, text: str, source: str = "upload") -> dict:
    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("Document has no indexable content")

    document_id = str(uuid.uuid4())
    query(
        db,
        """
        INSERT INTO "knowledge_documents" (id, company_id, title, source, storage_path, uploaded_by)
        VALUES (:id, :company_id, :title, :source, :path, NULL)
        """,
        {"id": document_id, "company_id": company_id, "title": title, "source": source, "path": f"inline://{company_id}/{document_id}"},
    )

    for chunk in chunks:
        query(
            db,
            """
            INSERT INTO "document_chunks" (id, company_id, document_id, content, embedding)
            VALUES (:id, :company_id, :document_id, :content, CAST(:embedding AS vector))
            """,
            {
                "id": str(uuid.uuid4()), "company_id": company_id, "document_id": document_id,
                "content": chunk["content"], "embedding": to_vector_literal(embed_text(chunk["content"])),
            },
        )

    return {"documentId": document_id, "chunkCount": len(chunks)}


def search_similar(db: Session, company_id: str, embedding: list[float], limit: int = 5) -> list[dict]:
    return query(
        db,
        """
        SELECT dc.id, dc.document_id, dc.content,
               1 - (dc.embedding <=> CAST(:embedding AS vector)) AS similarity,
               COALESCE(kd.title, 'Untitled') AS document_title
        FROM "document_chunks" dc
        LEFT JOIN "knowledge_documents" kd ON dc.document_id = kd.id
        WHERE dc.company_id = :company_id
        ORDER BY dc.embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
        """,
        {"embedding": to_vector_literal(embedding), "company_id": company_id, "limit": limit},
    )


def create_sop(db: Session, company_id: str, document_id: str | None, title: str, text: str) -> dict:
    sections = [section.strip() for section in re.split(r"\n(?=#{1,3}\s|Module\s+\d+)", text, flags=re.I) if section.strip()]
    modules = []
    for index, section in enumerate(sections[:12]):
        heading = section.split("\n")[0].lstrip("# ").strip()[:120] or f"Module {index + 1}"
        words = re.findall(r"[a-z0-9]{4,}", section.lower())
        freq: dict[str, int] = {}
        for word in words:
            freq[word] = freq.get(word, 0) + 1
        keywords = [word for word, _ in sorted(freq.items(), key=lambda item: item[1], reverse=True)[:6]]
        modules.append({"moduleNo": index + 1, "title": heading, "content": section, "keywords": keywords})

    if not modules:
        raise ValueError("SOP has no modules")

    sop_id = str(uuid.uuid4())
    query(
        db,
        """
        INSERT INTO "sops" (id, company_id, document_id, title, modules)
        VALUES (:id, :company_id, :document_id, :title, :modules)
        """,
        {"id": sop_id, "company_id": company_id, "document_id": document_id, "title": title, "modules": json.dumps(modules)},
    )
    return {"sopId": sop_id, "modules": len(modules)}


def get_sop(db: Session, company_id: str, sop_id: str):
    rows = query(
        db,
        'SELECT id, company_id, title, modules FROM "sops" WHERE id = :sop_id AND company_id = :company_id',
        {"sop_id": sop_id, "company_id": company_id},
    )
    return rows[0] if rows else None


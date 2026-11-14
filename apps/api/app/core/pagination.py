import base64
import json
from typing import Any, List, Optional
from pydantic import BaseModel, Field

class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    cursor: Optional[str] = None

class PageMeta(BaseModel):
    total: int
    page: int
    limit: int
    totalPages: int
    hasNext: bool
    hasPrev: bool
    nextCursor: Optional[str] = None

def paginate(items: List[Any], total: int, params: PaginationParams, cursor_field: Optional[str] = "id") -> dict:
    """
    Standard enterprise pagination helper supporting both Offset and Cursor modes.
    Ensures query results never exhaust server RAM or cause browser timeouts.
    """
    total_pages = max(1, (total + params.limit - 1) // params.limit)
    has_next = params.page < total_pages
    has_prev = params.page > 1

    next_cursor = None
    if items and has_next and cursor_field:
        last_item = items[-1]
        val = last_item.get(cursor_field) if isinstance(last_item, dict) else getattr(last_item, cursor_field, None)
        if val is not None:
            raw = json.dumps({"cursor": str(val)})
            next_cursor = base64.urlsafe_b64encode(raw.encode()).decode()

    meta = PageMeta(
        total=total,
        page=params.page,
        limit=params.limit,
        totalPages=total_pages,
        hasNext=has_next,
        hasPrev=has_prev,
        nextCursor=next_cursor,
    )
    return {"items": items, "pagination": meta.model_dump()}


import httpx
from typing import Any


def invoke_external_api(
    base_url: str,
    endpoint: str,
    method: str = "GET",
    token: str | None = None,
    headers: dict | None = None,
    params: dict | None = None,
    json_data: dict | None = None,
    timeout: float = 10.0,
) -> dict:
    """Universal HTTP tool for agents to call external REST APIs using user session token."""
    req_headers = {"Content-Type": "application/json", **(headers or {})}
    if token:
        req_headers["Authorization"] = token if token.startswith("Bearer ") else f"Bearer {token}"
    url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"
    try:
        with httpx.Client(timeout=timeout) as client:
            res = client.request(method.upper(), url, headers=req_headers, params=params, json=json_data)
            try:
                data = res.json()
            except Exception:
                data = res.text
            return {"success": res.status_code < 400, "status": res.status_code, "data": data}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def transform_tabular_data(records: list[dict], group_by: str | None = None, aggregate_field: str | None = None) -> dict:
    """Universal data engine to aggregate, filter, and calculate summaries from external ERP/HCM tables."""
    if not records:
        return {"total": 0, "rows": []}
    if not group_by or not aggregate_field:
        return {"total": len(records), "rows": records[:50]}
    grouped: dict[str, float] = {}
    for r in records:
        key = str(r.get(group_by, "Unknown"))
        val = float(r.get(aggregate_field, 0) or 0)
        grouped[key] = round(grouped.get(key, 0.0) + val, 2)
    return {"total": len(records), "grouped": grouped}


def dispatch_webhook_callback(callback_url: str, payload: dict, secret: str | None = None) -> bool:
    """Dispatches asynchronous completion signals and webhooks back to external host systems."""
    if not callback_url:
        return False
    headers = {"Content-Type": "application/json"}
    if secret:
        headers["x-webhook-secret"] = secret
    try:
        res = httpx.post(callback_url, json=payload, headers=headers, timeout=5.0)
        return res.status_code < 300
    except Exception:
        return False

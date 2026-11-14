import re
import httpx
from .external_tools import invoke_external_api

PROBE_PATHS = ["/openapi.json", "/swagger.json", "/api-docs", "/v2/api-docs", "/api/openapi.json", "/docs/openapi.json"]


def auto_discover_backend(base_url: str, token: str | None = None) -> list[dict]:
    """Autonomous zero-config crawler that discovers all backend endpoints with 0 LLM token consumption."""
    base = base_url.rstrip("/")
    headers = {"Authorization": token if token and token.startswith("Bearer ") else f"Bearer {token}"} if token else {}
    with httpx.Client(timeout=4.0, headers=headers) as client:
        for p in PROBE_PATHS:
            try:
                res = client.get(f"{base}{p}")
                if res.status_code == 200:
                    routes = fetch_and_parse_openapi(spec_dict=res.json())
                    if routes:
                        return routes
            except Exception:
                continue
        try:
            gql_res = client.post(f"{base}/graphql", json={"query": "{ __schema { types { name fields { name } } } }"})
            if gql_res.status_code == 200:
                types = gql_res.json().get("data", {}).get("__schema", {}).get("types", [])
                gql_routes = []
                for t in types:
                    for f in t.get("fields") or []:
                        fname = f.get("name")
                        if fname and not fname.startswith("__"):
                            gql_routes.append({"path": "/graphql", "method": "POST", "summary": f"GraphQL {fname}", "parameters": ["query"], "keywords": [fname.lower()]})
                if gql_routes:
                    return gql_routes
        except Exception:
            pass
    return []


def fetch_and_parse_openapi(spec_url: str | None = None, spec_dict: dict | None = None) -> list[dict]:
    """Fetches and parses Swagger/OpenAPI JSON into a flat list of AI-callable tool routes."""
    data = spec_dict
    if not data and spec_url:
        try:
            with httpx.Client(timeout=8.0) as client:
                res = client.get(spec_url)
                if res.status_code == 200:
                    data = res.json()
        except Exception:
            return []

    if not isinstance(data, dict):
        return []

    routes = []
    paths = data.get("paths", {})
    for path, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, meta in methods.items():
            if method.lower() not in ("get", "post", "put", "patch", "delete") or not isinstance(meta, dict):
                continue
            summary = meta.get("summary") or meta.get("description") or meta.get("operationId") or path
            tags = meta.get("tags") or []
            params = [p.get("name") for p in meta.get("parameters", []) if isinstance(p, dict) and p.get("name")]
            routes.append({
                "path": path,
                "method": method.upper(),
                "summary": summary,
                "tags": tags,
                "parameters": params,
                "keywords": re.findall(r"[A-Za-z0-9]+", f"{path} {summary} {' '.join(tags)}".lower()),
            })
    return routes


def match_endpoint_to_prompt(prompt: str, endpoints: list[dict]) -> dict | None:
    """Matches a natural language user prompt to the most relevant external API route."""
    if not endpoints or not prompt:
        return None
    p_words = set(re.findall(r"[A-Za-z0-9]+", prompt.lower()))
    scored = []
    for ep in endpoints:
        overlap = len(p_words.intersection(ep.get("keywords", [])))
        if overlap > 0:
            scored.append((overlap, ep))
    if not scored:
        return None
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[0][1]


def execute_discovered_route(base_url: str, endpoint: dict, token: str | None, inputs: dict) -> dict:
    """Executes a matched external endpoint using user inputs and auth token."""
    path = endpoint["path"]
    method = endpoint["method"]
    for param in endpoint.get("parameters", []):
        if f"{{{param}}}" in path and param in inputs:
            path = path.replace(f"{{{param}}}", str(inputs[param]))

    params = {k: v for k, v in inputs.items() if k in endpoint.get("parameters", [])} if method == "GET" else None
    json_data = inputs if method in ("POST", "PUT", "PATCH") else None

    return invoke_external_api(
        base_url=base_url,
        endpoint=path,
        method=method,
        token=token,
        params=params,
        json_data=json_data,
    )

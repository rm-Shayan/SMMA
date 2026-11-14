"""Export the live FastAPI app to a Postman collection."""

import json
import os
import re
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app

OUT = Path(__file__).resolve().parents[3] / "docs" / "Styre-BOT.postman_collection.json"
PATH_PARAM_RE = re.compile(r"\{(\w+)\}")

TYPE_MAP = {"string": "string", "integer": 0, "number": 0, "boolean": False, "array": [], "object": {}}


def _env_value(name: str) -> str | None:
    key = re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()
    return os.getenv(name) or os.getenv(key)


def value_for(name: str, prop: dict) -> object:
    if prop.get("enum"):
        return prop["enum"][0]
    env = _env_value(name)
    if env:
        return env
    fmt = prop.get("format")
    if fmt in ("uuid", "date-time"):
        return str(uuid.uuid4()) if fmt == "uuid" else "2026-01-01T00:00:00Z"
    if "email" in name.lower():
        return "test@example.com"
    kind = prop.get("type")
    if kind == "integer":
        return 1
    if kind == "number":
        return 1
    if kind == "boolean":
        return True
    if kind == "array":
        return []
    if kind == "object":
        return {}
    return "test value"


def sample_from_schema(schema: dict, spec: dict, depth: int = 0) -> dict:
    if depth > 3 or not isinstance(schema, dict):
        return {}
    if "$ref" in schema:
        name = schema["$ref"].split("/")[-1]
        return sample_from_schema(spec.get("components", {}).get("schemas", {}).get(name, {}), spec, depth + 1)
    if "properties" not in schema:
        return {}
    out = {}
    for key, prop in schema["properties"].items():
        if "$ref" in prop:
            out[key] = sample_from_schema(prop, spec, depth + 1)
        elif prop.get("type") == "array":
            out[key] = [value_for(key, prop.get("items", {}))]
        else:
            out[key] = value_for(key, prop)
    return out


def path_param_names(path: str) -> list[str]:
    return PATH_PARAM_RE.findall(path)


def build_request(path: str, method: str, op: dict, spec: dict) -> dict:
    postman_path = PATH_PARAM_RE.sub(r":\1", path)
    url = {
        "raw": "{{baseUrl}}" + postman_path,
        "host": ["{{baseUrl}}"],
        "path": postman_path.strip("/").split("/"),
    }
    names = path_param_names(path)
    if names:
        url["variable"] = [{"key": name, "value": os.getenv(name, "")} for name in names]
    query = []
    for param in op.get("parameters", []):
        if param.get("in") == "query":
            schema = param.get("schema") or {}
            if schema.get("type") == "integer":
                value = "100"
            elif schema.get("type") == "boolean":
                value = "true"
            else:
                value = "test"
            query.append({"key": param["name"], "value": value, "description": param.get("description", "")})
    if query:
        url["query"] = query

    request = {
        "method": method.upper(),
        "header": [
            {"key": "x-tenant-id", "value": "{{x-tenant-id}}"},
            {"key": "x-user-id", "value": "{{x-user-id}}"},
            {"key": "Content-Type", "value": "application/json"},
        ],
        "url": url,
    }

    body = op.get("requestBody", {}).get("content", {}).get("application/json", {}).get("schema")
    if body and method.upper() in ("POST", "PUT", "PATCH"):
        request["body"] = {"mode": "raw", "raw": json.dumps(sample_from_schema(body, spec), indent=2)}
    return request


def main() -> int:
    spec = app.openapi()
    groups: dict[str, list] = {}
    for path, methods in spec["paths"].items():
        for method, op in methods.items():
            tag = (op.get("tags") or ["general"])[0]
            groups.setdefault(tag, []).append(
                {"name": f"{method.upper()} {path}", "request": build_request(path, method, op, spec)}
            )

    collection = {
        "info": {
            "name": "Styre-BOT API",
            "description": "Auto-generated from FastAPI OpenAPI. Set x-tenant-id and x-user-id variables.",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        "variable": [
            {"key": "baseUrl", "value": "http://localhost:5000"},
            {"key": "x-tenant-id", "value": ""},
            {"key": "x-user-id", "value": ""},
            {"key": "agent_id", "value": "8"},
            {"key": "company_id", "value": ""},
            {"key": "user_id", "value": ""},
        ],
        "item": [{"name": tag, "item": items} for tag, items in sorted(groups.items())],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(collection, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} with {sum(len(v) for v in groups.values())} requests in {len(groups)} folders")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
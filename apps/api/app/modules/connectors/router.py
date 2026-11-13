import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.db import get_db
from ...core.deps import Tenant, get_tenant, require_roles

router = APIRouter()


class ConnectorBody(BaseModel):
    name: str
    type: str
    config: dict = {}


@router.get("")
def list_connectors(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, type, name, write_enabled, status FROM "connectors" WHERE company_id = :c ORDER BY name'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "connectors": [dict(row._mapping) for row in rows]}


@router.post("")
def create_connector(body: ConnectorBody, tenant: Tenant = Depends(require_roles("company_admin")), db: Session = Depends(get_db)):
    if body.type not in ("rest", "sql", "file", "webhook", "mcp"):
        return {"success": False, "error": "Unsupported connector type"}
    connector_id = str(uuid.uuid4())
    db.execute(
        text(
            'INSERT INTO "connectors" (id, company_id, type, name, config_enc, write_enabled, status) '
            "VALUES (:id, :c, :type, :name, :config, false, 'active')"
        ),
        {"id": connector_id, "c": tenant.company_id, "type": body.type, "name": body.name, "config": json.dumps(body.config)},
    )
    db.commit()
    return {"success": True, "connector": {"id": connector_id, **body.model_dump()}}


@router.get("/accounts")
def connected_accounts(tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    rows = db.execute(
        text('SELECT id, provider, display_name, status FROM "connected_accounts" WHERE company_id = :c ORDER BY created_at DESC'),
        {"c": tenant.company_id},
    ).all()
    return {"success": True, "accounts": [dict(row._mapping) for row in rows]}


@router.post("/{connector_id}/test")
def test_connector(connector_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT id, type, name, config_enc FROM "connectors" WHERE id = :id AND company_id = :c'),
        {"id": connector_id, "c": tenant.company_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Connector not found")

    connector_type = row[1]
    config = json.loads(row[3] or "{}")

    if connector_type == "rest":
        import httpx

        base = (config.get("baseUrl") or "").rstrip("/")
        if not base:
            return {"success": False, "error": "baseUrl missing in connector config"}
        try:
            res = httpx.get(f"{base}/health", timeout=5)
            return {"success": res.status_code < 500, "status": res.status_code}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    if connector_type == "sql":
        import psycopg

        dsn = config.get("connectionString")
        if not dsn:
            return {"success": False, "error": "connectionString missing in connector config"}
        try:
            with psycopg.connect(dsn, connect_timeout=5) as conn:
                conn.execute("SELECT 1")
            return {"success": True}
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    return {"success": True, "simulated": True, "type": connector_type}


@router.delete("/{connector_id}")
def delete_connector(connector_id: str, tenant: Tenant = Depends(require_roles("company_admin")), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT id FROM "connectors" WHERE id = :id AND company_id = :c'),
        {"id": connector_id, "c": tenant.company_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Connector not found")
    db.execute(text('DELETE FROM "connectors" WHERE id = :id'), {"id": connector_id})
    db.commit()
    return {"success": True, "connectorId": connector_id}

class MappingBody(BaseModel):
    resource: str
    semanticName: str


@router.post("/{connector_id}/mapping")
def create_mapping(connector_id: str, body: MappingBody, tenant: Tenant = Depends(require_roles("company_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id FROM "connectors" WHERE id = :id AND company_id = :c'), {"id": connector_id, "c": tenant.company_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Connector not found")
    mapping_id = str(uuid.uuid4())
    db.execute(
        text('INSERT INTO "connector_mappings" (id, connector_id, resource, semantic_name) VALUES (:id, :connector, :resource, :name)'),
        {"id": mapping_id, "connector": connector_id, "resource": body.resource, "name": body.semanticName},
    )
    db.commit()
    return {"success": True, "mapping": {"id": mapping_id, **body.model_dump()}}


@router.delete("/accounts/{account_id}")
def delete_account(account_id: str, tenant: Tenant = Depends(require_roles("company_admin")), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id FROM "connected_accounts" WHERE id = :id AND company_id = :c'), {"id": account_id, "c": tenant.company_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Account not found")
    db.execute(text('DELETE FROM "connected_accounts" WHERE id = :id'), {"id": account_id})
    db.commit()
    return {"success": True, "accountId": account_id}

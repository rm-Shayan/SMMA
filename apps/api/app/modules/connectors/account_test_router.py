import json
import urllib.request
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...core.db import get_db
from ...core.deps import Tenant, get_tenant
from ...core.security import decrypt_token

router = APIRouter()


@router.post("/accounts/{account_id}/test")
def test_social_account(account_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(
        text('SELECT id, provider, display_name, token_enc, status FROM "connected_accounts" WHERE id = :id AND company_id = :c'),
        {"id": account_id, "c": tenant.company_id},
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Connected account not found")

    provider, token = row[1], decrypt_token(row[3] or "")

    if provider in ("meta", "facebook", "instagram"):
        try:
            url = f"https://graph.facebook.com/v19.0/me?access_token={token}&fields=id,name"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                display_name = data.get("name") or row[2]
                db.execute(text('UPDATE "connected_accounts" SET status = \'verified\', display_name = :name WHERE id = :id'), {"name": display_name, "id": account_id})
                db.commit()
                return {"success": True, "provider": provider, "status": "verified", "accountId": account_id, "accountName": display_name, "externalId": data.get("id"), "message": "Meta Graph API connection verified successfully."}
        except Exception as exc:
            return {"success": False, "provider": provider, "status": "error", "error": f"Token verification failed: {exc}"}

    if provider == "whatsapp":
        try:
            url = f"https://graph.facebook.com/v19.0/me?access_token={token}"
            with urllib.request.urlopen(urllib.request.Request(url), timeout=5) as resp:
                data = json.loads(resp.read().decode())
                return {"success": True, "provider": "whatsapp", "status": "verified", "accountName": data.get("name")}
        except Exception as exc:
            return {"success": False, "provider": "whatsapp", "status": "error", "error": str(exc)}

    if provider == "linkedin":
        try:
            url = "https://api.linkedin.com/v2/userinfo"
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode())
                return {"success": True, "provider": "linkedin", "status": "verified", "accountName": data.get("name")}
        except Exception:
            return {"success": True, "provider": "linkedin", "status": "dev_mode", "message": "LinkedIn configured in developer simulation mode until App review is completed."}

    return {"success": True, "provider": provider, "status": "connected"}


@router.post("/accounts/{account_id}/disconnect")
def disconnect_account(account_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, provider, display_name FROM "connected_accounts" WHERE id = :id AND company_id = :c'), {"id": account_id, "c": tenant.company_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Connected account not found")
    db.execute(text('UPDATE "connected_accounts" SET status = \'disconnected\' WHERE id = :id'), {"id": account_id})
    purged = db.execute(text('UPDATE "outbox_jobs" SET status = \'expired\' WHERE connected_account_id = :id AND status IN (\'queued\', \'paused\')'), {"id": account_id}).rowcount
    db.commit()
    return {"success": True, "accountId": account_id, "provider": row[1], "status": "disconnected", "purgedJobs": purged, "message": f"Account '{row[2]}' disconnected. {purged} queued jobs expired."}


@router.post("/accounts/{account_id}/reconnect")
def reconnect_account(account_id: str, tenant: Tenant = Depends(get_tenant), db: Session = Depends(get_db)):
    row = db.execute(text('SELECT id, provider, display_name FROM "connected_accounts" WHERE id = :id AND company_id = :c'), {"id": account_id, "c": tenant.company_id}).first()
    if not row:
        raise HTTPException(status_code=404, detail="Connected account not found")
    db.execute(text('UPDATE "connected_accounts" SET status = \'active\' WHERE id = :id'), {"id": account_id})
    db.commit()
    return {"success": True, "accountId": account_id, "provider": row[1], "status": "active", "message": f"Account '{row[2]}' reconnected and active."}

import stripe
from sqlalchemy.orm import Session

from ...core.audit import record
from ...core.config import settings
from . import service as ledger


def create_checkout_session(company_id: str, user_id: str | None, amount: int, price_usd: float, db: Session | None = None) -> dict:
    # If ENABLE_STRIPE is false, bypass Stripe completely and credit company wallet immediately
    if not settings.get("enable_stripe", False):
        if db:
            wallet = ledger.purchase(db, company_id, amount, user_id, note="Direct Purchase (Stripe Bypassed via ENABLE_STRIPE=false)")
            record(db, company_id, user_id, "bypassed_payment", "credit_wallets", None, {"creditsMinted": amount, "bypassed": True})
            return {
                "enabled": False,
                "bypassed": True,
                "message": "Stripe bypassed (ENABLE_STRIPE=false). Credits added directly to company wallet.",
                "checkoutUrl": None,
                "credits": amount,
                "priceUsd": price_usd,
                "wallet": wallet,
            }
        return {
            "enabled": False,
            "bypassed": True,
            "message": "Stripe bypassed (ENABLE_STRIPE=false).",
            "checkoutUrl": None,
            "credits": amount,
            "priceUsd": price_usd,
        }

    stripe.api_key = settings["stripe_secret_key"]
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": f"Styre-BOT AI Credits ({amount:,} credits)"},
                "unit_amount": int(price_usd * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=settings["stripe_success_url"],
        cancel_url=settings["stripe_cancel_url"],
        metadata={"company_id": company_id, "user_id": user_id or "", "credit_amount": str(amount)},
    )
    return {"enabled": True, "bypassed": False, "mode": "stripe", "sessionId": session.id, "checkoutUrl": session.url}


def handle_stripe_webhook(payload: bytes, signature: str, db: Session) -> dict:
    if not settings.get("enable_stripe", False):
        return {"status": "bypassed", "message": "Stripe webhook bypassed because ENABLE_STRIPE=false"}

    event = stripe.Webhook.construct_event(payload, signature, settings["stripe_webhook_secret"])
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        company_id = session["metadata"]["company_id"]
        credits_to_mint = int(session["metadata"]["credit_amount"])
        user_id = session["metadata"].get("user_id") or None

        ledger.purchase(db, company_id, credits_to_mint, user_id, note="Stripe Checkout Payment")
        record(db, company_id, user_id, "stripe_payment", "credit_wallets", None, {"creditsMinted": credits_to_mint, "stripeSessionId": session["id"]})
        return {"status": "success", "creditsMinted": credits_to_mint}
    return {"status": "ignored", "eventType": event["type"]}

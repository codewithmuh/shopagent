"""Webhook client for company payment integration.

Sends signed webhook requests to company endpoints for:
- Balance checks (can the user afford this order?)
- Charges (deduct from user's account)
"""
import hmac
import hashlib
import json
import time
import logging

import requests

logger = logging.getLogger(__name__)

WEBHOOK_TIMEOUT = 30  # seconds


class WebhookError(Exception):
    pass


def send_webhook(company, event_type: str, payload: dict) -> dict:
    """
    Send a signed webhook to the company and return the JSON response.

    Signature: HMAC-SHA256 of "{timestamp}.{body}" using company.webhook_secret
    Headers: X-Webhook-Signature, X-Webhook-Timestamp
    """
    if not company.webhook_url:
        raise WebhookError("Company has no webhook URL configured")

    timestamp = str(int(time.time()))
    body = json.dumps({
        "event": event_type,
        "timestamp": timestamp,
        **payload,
    })

    signature = hmac.new(
        company.webhook_secret.encode(),
        f"{timestamp}.{body}".encode(),
        hashlib.sha256,
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": f"sha256={signature}",
        "X-Webhook-Timestamp": timestamp,
    }

    try:
        response = requests.post(
            company.webhook_url,
            data=body,
            headers=headers,
            timeout=WEBHOOK_TIMEOUT,
        )
        response.raise_for_status()

        # Log webhook
        from companies.models import APIUsageLog
        APIUsageLog.objects.create(
            company=company,
            event_type=APIUsageLog.EventType.WEBHOOK_SENT,
            endpoint=company.webhook_url,
            metadata={"event_type": event_type, "status_code": response.status_code},
        )

        return response.json()
    except requests.Timeout:
        raise WebhookError("Company webhook timed out")
    except requests.RequestException as e:
        raise WebhookError(f"Webhook failed: {str(e)}")
    except json.JSONDecodeError:
        raise WebhookError("Company webhook returned invalid JSON")

import uuid
import secrets

from django.conf import settings
from django.db import models


class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    contact_email = models.EmailField(unique=True)
    password_hash = models.CharField(
        max_length=255, blank=True, help_text="Hashed password for portal login"
    )

    # API credentials (auto-generated on first save)
    client_id = models.CharField(max_length=64, unique=True, editable=False)
    secret_key = models.CharField(max_length=128, editable=False)

    # Webhook configuration
    webhook_url = models.URLField(
        blank=True, help_text="URL to receive payment webhooks"
    )
    webhook_secret = models.CharField(
        max_length=128, blank=True, editable=False,
        help_text="Secret for signing webhook payloads",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        prefix = "test" if settings.DEBUG else "live"
        if not self.client_id:
            self.client_id = f"shopagent_{prefix}_{secrets.token_hex(16)}"
        if not self.secret_key:
            self.secret_key = f"sk_{prefix}_{secrets.token_hex(32)}"
        if not self.webhook_secret:
            self.webhook_secret = f"whsec_{secrets.token_hex(32)}"
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = "companies"

    def __str__(self):
        return f"{self.name} ({self.client_id[:24]}...)"


class APIUsageLog(models.Model):
    class EventType(models.TextChoices):
        CHAT_REQUEST = "CHAT_REQUEST", "Chat Request"
        CHAT_HISTORY = "CHAT_HISTORY", "Chat History Request"
        ORDER_CREATED = "ORDER_CREATED", "Order Created"
        WEBHOOK_SENT = "WEBHOOK_SENT", "Webhook Sent"
        USER_LOOKUP = "USER_LOOKUP", "User Lookup"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="usage_logs"
    )
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    endpoint = models.CharField(max_length=255)
    user_id = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["company", "created_at"]),
            models.Index(fields=["company", "event_type"]),
        ]

    def __str__(self):
        return f"{self.company.name} - {self.event_type} ({self.created_at})"

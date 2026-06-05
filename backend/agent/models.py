import uuid
from django.db import models
from users.models import User


class AgentSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="sessions"
    )
    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE,
        null=True, blank=True, related_name="sessions",
    )
    session_token = models.CharField(max_length=255, unique=True)
    messages = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ["-last_active_at"]

    def __str__(self):
        user_label = self.user or "Anonymous"
        return f"Session {self.session_token[:8]}... ({user_label})"

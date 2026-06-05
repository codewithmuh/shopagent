from django.contrib import admin
from .models import AgentSession


@admin.register(AgentSession)
class AgentSessionAdmin(admin.ModelAdmin):
    list_display = ("session_token", "user", "company", "created_at", "last_active_at", "expires_at")
    list_filter = ("company", "created_at")
    search_fields = ("session_token", "user__external_user_id", "user__display_name")
    readonly_fields = ("id", "created_at", "last_active_at")

from django import forms
from django.contrib import admin
from django.contrib.auth.hashers import make_password
from .models import Company, APIUsageLog


class CompanyAdminForm(forms.ModelForm):
    password = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={"placeholder": "Leave blank to keep unchanged"}),
        help_text="Set the portal login password. Leave blank to keep the current password.",
    )

    class Meta:
        model = Company
        fields = "__all__"

    def save(self, commit=True):
        instance = super().save(commit=False)
        pw = self.cleaned_data.get("password")
        if pw:
            instance.password_hash = make_password(pw)
        if commit:
            instance.save()
        return instance


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    form = CompanyAdminForm
    list_display = ("name", "client_id_short", "contact_email", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "contact_email", "client_id")
    readonly_fields = (
        "id", "client_id", "secret_key", "webhook_secret",
        "created_at", "updated_at",
    )
    fieldsets = (
        (None, {"fields": ("name", "contact_email", "password", "is_active")}),
        ("API Credentials (auto-generated)", {
            "fields": ("client_id", "secret_key", "webhook_secret"),
        }),
        ("Webhooks", {"fields": ("webhook_url",)}),
        ("Metadata", {"fields": ("id", "created_at", "updated_at")}),
    )

    @admin.display(description="Client ID")
    def client_id_short(self, obj):
        return f"{obj.client_id[:24]}..."


@admin.register(APIUsageLog)
class APIUsageLogAdmin(admin.ModelAdmin):
    list_display = ("company", "event_type", "endpoint", "user_id", "created_at")
    list_filter = ("company", "event_type", "created_at")
    search_fields = ("company__name", "user_id")
    readonly_fields = ("id", "company", "event_type", "endpoint", "user_id", "metadata", "created_at")
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

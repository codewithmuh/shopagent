from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Merchant, MerchantConnection


@admin.register(Merchant)
class MerchantAdmin(BaseUserAdmin):
    list_display = ("email", "business_name", "country", "currency", "is_active", "is_staff", "created_at")
    list_filter = ("is_active", "is_staff", "is_superuser", "country")
    search_fields = ("email", "business_name")
    ordering = ("-created_at",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Info", {"fields": ("business_name", "country")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "business_name", "country", "password1", "password2")}),
    )


@admin.register(MerchantConnection)
class MerchantConnectionAdmin(admin.ModelAdmin):
    list_display = ("merchant", "source_type", "shop_domain", "is_active", "last_synced_at")
    list_filter = ("source_type", "is_active")

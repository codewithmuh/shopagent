from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "company", "merchant", "variant", "qty", "amount", "status", "created_at")
    list_filter = ("status", "company", "merchant")
    search_fields = ("user__external_user_id", "user__display_name", "external_transaction_id")
    readonly_fields = ("id", "created_at", "updated_at")

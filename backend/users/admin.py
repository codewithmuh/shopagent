from django.contrib import admin
from .models import User, ShippingAddress


class ShippingAddressInline(admin.TabularInline):
    model = ShippingAddress
    extra = 0


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("display_name_or_id", "company", "external_user_id", "email", "created_at")
    list_filter = ("company",)
    search_fields = ("external_user_id", "display_name", "email")
    inlines = [ShippingAddressInline]

    @admin.display(description="User")
    def display_name_or_id(self, obj):
        return obj.display_name or obj.external_user_id or obj.email or "Anonymous"


@admin.register(ShippingAddress)
class ShippingAddressAdmin(admin.ModelAdmin):
    list_display = ("full_name", "user", "city", "state", "country", "is_default")
    list_filter = ("country", "is_default")
    search_fields = ("full_name", "city")

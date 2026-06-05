from django.contrib import admin
from .models import Product, Variant


class VariantInline(admin.TabularInline):
    model = Variant
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "merchant", "merchant_country", "merchant_currency", "category", "is_active", "created_at")
    list_filter = ("is_active", "category", "merchant", "merchant__country")
    search_fields = ("title", "description")
    inlines = [VariantInline]

    @admin.display(description="Country", ordering="merchant__country")
    def merchant_country(self, obj):
        return obj.merchant.country

    @admin.display(description="Currency")
    def merchant_currency(self, obj):
        return obj.merchant.currency


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display = ("product", "title", "price", "currency", "merchant_country", "available_qty")
    list_filter = ("currency", "product__merchant__country")
    search_fields = ("product__title", "title", "sku")

    @admin.display(description="Country", ordering="product__merchant__country")
    def merchant_country(self, obj):
        return obj.product.merchant.country

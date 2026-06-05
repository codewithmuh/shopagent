from rest_framework import serializers
from .models import Product, Variant


class VariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Variant
        fields = [
            "id", "title", "price", "compare_at_price", "currency",
            "sku", "barcode", "weight", "weight_unit",
            "available_qty", "updated_at",
        ]


class ProductSerializer(serializers.ModelSerializer):
    variants = VariantSerializer(many=True, read_only=True)
    merchant_name = serializers.CharField(
        source="merchant.business_name", read_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id", "merchant", "merchant_name", "title", "description",
            "brand", "tags", "images", "category", "is_active", "variants",
            "created_at", "updated_at",
        ]


class ProductSearchSerializer(serializers.ModelSerializer):
    variants = VariantSerializer(many=True, read_only=True)
    merchant_name = serializers.CharField(
        source="merchant.business_name", read_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id", "merchant", "merchant_name", "title", "description",
            "brand", "tags", "images", "category", "variants",
        ]

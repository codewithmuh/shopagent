from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(
        source="variant.product.title", read_only=True
    )
    variant_title = serializers.CharField(source="variant.title", read_only=True)
    merchant_name = serializers.CharField(
        source="merchant.business_name", read_only=True
    )

    class Meta:
        model = Order
        fields = [
            "id", "agent_request_id", "user", "merchant", "merchant_name",
            "variant", "product_title", "variant_title",
            "qty", "amount", "currency", "status",
            "external_transaction_id",
            "created_at", "updated_at",
        ]

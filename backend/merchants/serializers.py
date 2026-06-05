from rest_framework import serializers
from .models import Merchant, MerchantConnection


class MerchantSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Merchant
        fields = ["id", "email", "business_name", "password"]

    def create(self, validated_data):
        return Merchant.objects.create_user(**validated_data)


class MerchantSerializer(serializers.ModelSerializer):
    currency = serializers.CharField(read_only=True)

    class Meta:
        model = Merchant
        fields = ["id", "email", "business_name", "country", "currency", "created_at"]


class MerchantConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MerchantConnection
        fields = [
            "id", "source_type", "shop_domain", "is_active",
            "last_synced_at", "created_at",
        ]


class ShopifyConnectSerializer(serializers.Serializer):
    shop_domain = serializers.CharField(max_length=255)
    admin_access_token = serializers.CharField(max_length=500)

    def validate_shop_domain(self, value):
        value = value.strip().lower().rstrip("/")
        # Remove https:// prefix if user included it
        if value.startswith("https://"):
            value = value[8:]
        if value.startswith("http://"):
            value = value[7:]
        # Reject if it looks like a token pasted in the wrong field
        if value.startswith("shpat_") or value.startswith("shpca_"):
            raise serializers.ValidationError(
                "This looks like an access token, not a shop domain. "
                "Enter your store domain (e.g. your-store.myshopify.com)."
            )
        # Basic domain format check
        if "." not in value:
            raise serializers.ValidationError(
                "Enter a valid shop domain (e.g. your-store.myshopify.com)."
            )
        return value

    def validate_admin_access_token(self, value):
        value = value.strip()
        # Reject if it looks like a domain pasted in the wrong field
        if ".myshopify.com" in value or ".shopify.com" in value:
            raise serializers.ValidationError(
                "This looks like a shop domain, not an access token. "
                "Enter your Admin API access token (starts with shpat_)."
            )
        return value

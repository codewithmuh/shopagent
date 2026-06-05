from rest_framework import serializers
from .models import User, ShippingAddress


class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True, default=None)

    class Meta:
        model = User
        fields = [
            "id", "external_user_id",
            "display_name", "email", "company_name", "created_at",
        ]


class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingAddress
        fields = [
            "id", "full_name", "address_line_1", "address_line_2",
            "city", "state", "postal_code", "country", "phone",
            "is_default", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

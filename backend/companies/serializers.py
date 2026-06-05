from rest_framework import serializers

from .models import Company, APIUsageLog


class CompanyRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    contact_email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)


class CompanyLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            "id", "name", "contact_email", "client_id", "secret_key",
            "webhook_url", "webhook_secret", "is_active", "created_at",
        ]
        read_only_fields = fields


class CompanyUpdateSerializer(serializers.Serializer):
    webhook_url = serializers.URLField(required=False, allow_blank=True)
    name = serializers.CharField(max_length=255, required=False)


class APIUsageLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = APIUsageLog
        fields = ["id", "event_type", "endpoint", "user_id", "metadata", "created_at"]


class UsageSummarySerializer(serializers.Serializer):
    total_requests = serializers.IntegerField()
    chat_requests = serializers.IntegerField()
    orders_created = serializers.IntegerField()
    webhooks_sent = serializers.IntegerField()

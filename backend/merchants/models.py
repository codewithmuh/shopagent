import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class MerchantManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        merchant = self.model(email=email, **extra_fields)
        merchant.set_password(password)
        merchant.save(using=self._db)
        return merchant

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


COUNTRY_CURRENCY_MAP = {
    "US": "USD",
    "GB": "GBP",
    "EU": "EUR",
    "AE": "AED",
    "SA": "SAR",
    "PK": "PKR",
    "IN": "INR",
    "JP": "JPY",
    "CN": "CNY",
    "AU": "AUD",
    "CA": "CAD",
}


class Merchant(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    business_name = models.CharField(max_length=255)
    country = models.CharField(max_length=5, default="US", help_text="Country code (US, GB, AE, PK, etc.)")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def currency(self):
        return COUNTRY_CURRENCY_MAP.get(self.country, "USD")

    objects = MerchantManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["business_name"]

    def __str__(self):
        return f"{self.business_name} ({self.email})"


class MerchantConnection(models.Model):
    class SourceType(models.TextChoices):
        SHOPIFY = "SHOPIFY", "Shopify"
        MANUAL = "MANUAL", "Manual"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(
        Merchant, on_delete=models.CASCADE, related_name="connections"
    )
    source_type = models.CharField(
        max_length=20, choices=SourceType.choices, default=SourceType.SHOPIFY
    )
    shop_domain = models.CharField(max_length=255, blank=True)
    access_token_encrypted = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["merchant", "shop_domain"]

    def __str__(self):
        return f"{self.merchant.business_name} - {self.source_type} ({self.shop_domain})"

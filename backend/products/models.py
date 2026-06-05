import uuid
from django.db import models
from merchants.models import Merchant


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    merchant = models.ForeignKey(
        Merchant, on_delete=models.CASCADE, related_name="products"
    )
    external_product_id = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    brand = models.CharField(max_length=255, blank=True)
    tags = models.JSONField(default=list, blank=True)
    images = models.JSONField(default=list)
    category = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Variant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    external_variant_id = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255, default="Default")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    compare_at_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default="USD")
    sku = models.CharField(max_length=255, blank=True)
    barcode = models.CharField(max_length=255, blank=True)
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    weight_unit = models.CharField(max_length=10, blank=True)
    available_qty = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-set currency from merchant's country on creation
        if not self.pk and self.currency == "USD":
            self.currency = self.product.merchant.currency
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.title} - {self.title} ({self.currency} {self.price})"

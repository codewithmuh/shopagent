import uuid
from django.db import models
from django.utils import timezone
from merchants.models import Merchant
from products.models import Variant
from users.models import User


class Order(models.Model):
    class Status(models.TextChoices):
        CREATED = "CREATED", "Created"
        INVENTORY_LOCKED = "INVENTORY_LOCKED", "Inventory Locked"
        BALANCE_CHECK_PENDING = "BALANCE_CHECK_PENDING", "Balance Check Pending"
        PAYMENT_PENDING = "PAYMENT_PENDING", "Payment Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent_request_id = models.UUIDField(unique=True, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    merchant = models.ForeignKey(
        Merchant, on_delete=models.CASCADE, related_name="orders"
    )
    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE,
        null=True, blank=True, related_name="orders",
    )
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE)
    qty = models.PositiveIntegerField(default=1)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    status = models.CharField(
        max_length=25, choices=Status.choices, default=Status.CREATED
    )
    external_transaction_id = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="Transaction ID from company's payment system",
    )
    shipping_address = models.ForeignKey(
        "users.ShippingAddress", on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order {self.id} - {self.status} (${self.amount})"


class OrderFollowUp(models.Model):
    """Scheduled post-delivery follow-up message sent to the user 3 days after order is paid."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        WEBHOOK_SENT = "WEBHOOK_SENT", "Webhook Sent"
        DELIVERED = "DELIVERED", "Delivered in Chat"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="follow_up")
    send_after = models.DateTimeField(help_text="When to send the follow-up message")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    webhook_sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["send_after"]

    def __str__(self):
        return f"FollowUp for Order {self.order_id} — {self.status} (after {self.send_after})"

    def message(self) -> str:
        """Generate the follow-up message text."""
        product = self.order.variant.product.title
        variant = self.order.variant.title
        name = self.order.user.display_name or "there"
        return (
            f"Hi {name}! Just checking in on your recent order for **{product}** ({variant}). "
            f"Did your package arrive okay? If everything went well, great! "
            f"If there's anything missing or wrong, let me know and I'll help sort it out."
        )

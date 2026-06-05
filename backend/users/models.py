import uuid
from django.db import models


class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE,
        null=True, blank=True, related_name="users",
    )
    external_user_id = models.CharField(
        max_length=255, blank=True, default="",
        help_text="The company's own user identifier",
    )
    display_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True, null=True)
    password_hash = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["company", "external_user_id"],
                name="unique_company_user",
            ),
        ]

    def __str__(self):
        label = self.display_name or self.external_user_id or self.email or "Anonymous"
        company_name = self.company.name if self.company else "No Company"
        return f"{label} ({company_name})"


class ShippingAddress(models.Model):
    class AddressType(models.TextChoices):
        HOME = "home", "Home"
        OFFICE = "office", "Office"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="shipping_addresses"
    )
    address_type = models.CharField(
        max_length=20, choices=AddressType.choices, default=AddressType.HOME,
    )
    label = models.CharField(
        max_length=100, blank=True, default="",
        help_text="Custom label e.g. 'Mom's house', 'Downtown office'",
    )
    full_name = models.CharField(max_length=255)
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default="US")
    phone = models.CharField(max_length=30, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        type_label = self.label or self.get_address_type_display()
        return f"{self.full_name} - {type_label} ({self.city}, {self.state})"

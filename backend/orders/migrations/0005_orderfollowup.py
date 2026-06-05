import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0004_remove_order_tx_hash_alter_order_currency"),
    ]

    operations = [
        migrations.CreateModel(
            name="OrderFollowUp",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("send_after", models.DateTimeField(help_text="When to send the follow-up message")),
                ("status", models.CharField(
                    choices=[
                        ("PENDING", "Pending"),
                        ("WEBHOOK_SENT", "Webhook Sent"),
                        ("DELIVERED", "Delivered in Chat"),
                        ("FAILED", "Failed"),
                    ],
                    default="PENDING",
                    max_length=20,
                )),
                ("webhook_sent_at", models.DateTimeField(blank=True, null=True)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("order", models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="follow_up",
                    to="orders.order",
                )),
            ],
            options={"ordering": ["send_after"]},
        ),
    ]

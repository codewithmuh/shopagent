"""Management command: send due order follow-up webhooks.

Run via cron / AWS EventBridge every 4 hours:
    python manage.py send_followups
"""
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from orders.models import OrderFollowUp

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Send due order follow-up webhooks to company endpoints"

    def handle(self, *args, **options):
        due = OrderFollowUp.objects.filter(
            status=OrderFollowUp.Status.PENDING,
            send_after__lte=timezone.now(),
            order__company__isnull=False,
            order__company__webhook_url__isnull=False,
        ).select_related(
            "order__user",
            "order__variant__product",
            "order__company",
        ).exclude(order__company__webhook_url="")

        total = due.count()
        self.stdout.write(f"Found {total} due follow-up(s) to send.")

        sent = 0
        failed = 0

        for follow_up in due:
            order = follow_up.order
            company = order.company
            try:
                from integrations.webhooks import send_webhook
                send_webhook(company, "order_followup", {
                    "order_id": str(order.id),
                    "user_id": order.user.external_user_id,
                    "product": order.variant.product.title,
                    "variant": order.variant.title,
                    "qty": order.qty,
                    "amount": str(order.amount),
                    "currency": order.currency,
                    "message": follow_up.message(),
                    "order_created_at": order.created_at.isoformat(),
                })
                follow_up.status = OrderFollowUp.Status.WEBHOOK_SENT
                follow_up.webhook_sent_at = timezone.now()
                follow_up.save(update_fields=["status", "webhook_sent_at"])
                sent += 1
                logger.info("Follow-up webhook sent for order %s", order.id)
            except Exception as e:
                follow_up.status = OrderFollowUp.Status.FAILED
                follow_up.save(update_fields=["status"])
                failed += 1
                logger.error("Failed to send follow-up for order %s: %s", order.id, e)

        self.stdout.write(
            self.style.SUCCESS(f"Done: {sent} sent, {failed} failed out of {total} total.")
        )

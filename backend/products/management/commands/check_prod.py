from django.core.management.base import BaseCommand
from merchants.models import MerchantConnection, Merchant
from products.models import Product
from orders.models import Order


class Command(BaseCommand):
    help = "Check production data state"

    def handle(self, *args, **options):
        self.stdout.write("=== Merchants ===")
        for m in Merchant.objects.all():
            self.stdout.write(f"  {m.business_name} | {m.email} | id={m.id} | products={m.products.count()}")

        self.stdout.write("\n=== Connections ===")
        for c in MerchantConnection.objects.select_related("merchant").all():
            self.stdout.write(f"  {c.merchant.business_name} | {c.shop_domain} | active={c.is_active}")

        self.stdout.write(f"\n=== Orders ===")
        self.stdout.write(f"Total: {Order.objects.count()}")

        self.stdout.write("\n=== Schema check ===")
        p = Product.objects.first()
        if p:
            self.stdout.write(f"Title: {p.title}")
            self.stdout.write(f"Brand: '{p.brand}'")
            self.stdout.write(f"Tags: {p.tags}")
            img_type = type(p.images[0]).__name__ if p.images else "none"
            self.stdout.write(f"Images type: {img_type}")
            img_preview = str(p.images[0])[:100] if p.images else "none"
            self.stdout.write(f"First image: {img_preview}")
        else:
            self.stdout.write("No products found")

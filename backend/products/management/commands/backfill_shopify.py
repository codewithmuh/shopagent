from django.core.management.base import BaseCommand
from merchants.models import MerchantConnection
from integrations.shopify import sync_shopify_products


class Command(BaseCommand):
    help = "Re-sync all Shopify connections to backfill brand, tags, and S3 images"

    def handle(self, *args, **options):
        conns = MerchantConnection.objects.filter(source_type="SHOPIFY", is_active=True)
        self.stdout.write(f"Found {conns.count()} active Shopify connections")

        for conn in conns:
            self.stdout.write(f"Syncing {conn.shop_domain} ({conn.merchant.business_name})...")
            sync_shopify_products(conn)
            self.stdout.write(f"  Done!")

        # Show results
        from products.models import Product
        synced = Product.objects.exclude(external_product_id__isnull=True).exclude(external_product_id="")
        self.stdout.write(f"\nTotal synced products: {synced.count()}")
        with_brand = synced.exclude(brand="").count()
        self.stdout.write(f"Products with brand: {with_brand}")

        p = synced.first()
        if p:
            self.stdout.write(f"\nSample: {p.title}")
            self.stdout.write(f"  Brand: {p.brand}")
            self.stdout.write(f"  Tags: {p.tags}")
            if p.images:
                img = p.images[0]
                src = img["src"] if isinstance(img, dict) else img
                self.stdout.write(f"  Image: {src[:80]}")

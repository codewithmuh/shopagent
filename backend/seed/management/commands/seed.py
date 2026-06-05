"""Management command to seed the database with mock data."""
from decimal import Decimal
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from companies.models import Company
from merchants.models import Merchant, MerchantConnection
from products.models import Product, Variant
from users.models import User, ShippingAddress


MERCHANTS = [
    {"email": "store@urbanstyle.com", "business_name": "Urban Style Co.", "password": "demo1234", "country": "US"},
    {"email": "hello@techgadgets.io", "business_name": "Tech Gadgets Hub", "password": "demo1234", "country": "US"},
    {"email": "shop@greenleaf.co", "business_name": "GreenLeaf Organics", "password": "demo1234", "country": "GB"},
    {"email": "info@luxwatches.com", "business_name": "Lux Watches", "password": "demo1234", "country": "AE"},
    {"email": "support@fitgear.store", "business_name": "FitGear Athletics", "password": "demo1234", "country": "US"},
]

PRODUCTS = [
    # Urban Style Co.
    {"merchant_idx": 0, "title": "Classic Denim Jacket", "description": "Premium denim jacket with a vintage wash. Comfortable fit for everyday wear.", "category": "Clothing", "images": ["https://picsum.photos/seed/denim/400/400"], "variants": [
        {"title": "Small", "price": "79.99", "sku": "US-DJ-S", "qty": 25},
        {"title": "Medium", "price": "79.99", "sku": "US-DJ-M", "qty": 40},
        {"title": "Large", "price": "79.99", "sku": "US-DJ-L", "qty": 30},
    ]},
    {"merchant_idx": 0, "title": "Graphic Tee - Abstract Art", "description": "100% cotton graphic t-shirt featuring unique abstract art design.", "category": "Clothing", "images": ["https://picsum.photos/seed/tee/400/400"], "variants": [
        {"title": "S", "price": "29.99", "sku": "US-GT-S", "qty": 100},
        {"title": "M", "price": "29.99", "sku": "US-GT-M", "qty": 100},
        {"title": "L", "price": "29.99", "sku": "US-GT-L", "qty": 80},
    ]},
    {"merchant_idx": 0, "title": "Slim Fit Chinos", "description": "Modern slim fit chinos in khaki. Stretch fabric for comfort.", "category": "Clothing", "images": ["https://picsum.photos/seed/chinos/400/400"], "variants": [
        {"title": "30x32", "price": "59.99", "sku": "US-CH-30", "qty": 20},
        {"title": "32x32", "price": "59.99", "sku": "US-CH-32", "qty": 35},
        {"title": "34x32", "price": "59.99", "sku": "US-CH-34", "qty": 25},
    ]},
    # Tech Gadgets Hub
    {"merchant_idx": 1, "title": "Wireless Noise Cancelling Headphones", "description": "Premium over-ear headphones with active noise cancellation. 30hr battery life.", "category": "Electronics", "images": ["https://picsum.photos/seed/headphones/400/400"], "variants": [
        {"title": "Black", "price": "149.99", "sku": "TG-WH-BK", "qty": 50},
        {"title": "White", "price": "149.99", "sku": "TG-WH-WH", "qty": 30},
    ]},
    {"merchant_idx": 1, "title": "Portable Bluetooth Speaker", "description": "Waterproof portable speaker with 360-degree sound. Perfect for outdoor use.", "category": "Electronics", "images": ["https://picsum.photos/seed/speaker/400/400"], "variants": [
        {"title": "Default", "price": "69.99", "sku": "TG-BS-01", "qty": 75},
    ]},
    {"merchant_idx": 1, "title": "Smart Watch Pro", "description": "Fitness tracking smartwatch with heart rate, GPS, and 7-day battery.", "category": "Electronics", "images": ["https://picsum.photos/seed/smartwatch/400/400"], "variants": [
        {"title": "42mm Black", "price": "249.99", "sku": "TG-SW-42B", "qty": 20},
        {"title": "46mm Silver", "price": "279.99", "sku": "TG-SW-46S", "qty": 15},
    ]},
    {"merchant_idx": 1, "title": "USB-C Hub 7-in-1", "description": "Multi-port USB-C adapter with HDMI, USB-A, SD card, and power delivery.", "category": "Electronics", "images": ["https://picsum.photos/seed/usbhub/400/400"], "variants": [
        {"title": "Default", "price": "45.99", "sku": "TG-HB-01", "qty": 200},
    ]},
    # GreenLeaf Organics
    {"merchant_idx": 2, "title": "Organic Matcha Powder", "description": "Ceremonial grade organic matcha from Kyoto, Japan. 100g tin.", "category": "Food & Drink", "images": ["https://picsum.photos/seed/matcha/400/400"], "variants": [
        {"title": "100g", "price": "34.99", "sku": "GL-MP-100", "qty": 150},
        {"title": "250g", "price": "74.99", "sku": "GL-MP-250", "qty": 60},
    ]},
    {"merchant_idx": 2, "title": "Cold-Pressed Juice Bundle", "description": "6-pack of cold-pressed organic juices. Green, citrus, and berry flavors.", "category": "Food & Drink", "images": ["https://picsum.photos/seed/juice/400/400"], "variants": [
        {"title": "6-Pack", "price": "42.99", "sku": "GL-JB-06", "qty": 40},
    ]},
    {"merchant_idx": 2, "title": "Natural Skincare Set", "description": "Organic facial cleanser, toner, and moisturizer set. Vegan and cruelty-free.", "category": "Beauty", "images": ["https://picsum.photos/seed/skincare/400/400"], "variants": [
        {"title": "Full Set", "price": "89.99", "sku": "GL-SK-FS", "qty": 30},
    ]},
    # Lux Watches
    {"merchant_idx": 3, "title": "Classic Automatic Watch", "description": "Swiss-made automatic movement watch with sapphire crystal and leather strap.", "category": "Watches", "images": ["https://picsum.photos/seed/watch1/400/400"], "variants": [
        {"title": "Silver/Brown", "price": "499.99", "sku": "LW-CA-SB", "qty": 10},
        {"title": "Gold/Black", "price": "549.99", "sku": "LW-CA-GB", "qty": 8},
    ]},
    {"merchant_idx": 3, "title": "Minimalist Quartz Watch", "description": "Ultra-thin quartz watch with mesh strap. Japanese movement.", "category": "Watches", "images": ["https://picsum.photos/seed/watch2/400/400"], "variants": [
        {"title": "Silver", "price": "199.99", "sku": "LW-MQ-S", "qty": 25},
        {"title": "Rose Gold", "price": "219.99", "sku": "LW-MQ-RG", "qty": 15},
    ]},
    # FitGear Athletics
    {"merchant_idx": 4, "title": "Performance Running Shoes", "description": "Lightweight running shoes with responsive cushioning and breathable mesh.", "category": "Footwear", "images": ["https://picsum.photos/seed/shoes/400/400"], "variants": [
        {"title": "US 9", "price": "129.99", "sku": "FG-RS-09", "qty": 20},
        {"title": "US 10", "price": "129.99", "sku": "FG-RS-10", "qty": 30},
        {"title": "US 11", "price": "129.99", "sku": "FG-RS-11", "qty": 25},
    ]},
    {"merchant_idx": 4, "title": "Yoga Mat Premium", "description": "Extra thick eco-friendly yoga mat with alignment lines. Non-slip surface.", "category": "Fitness", "images": ["https://picsum.photos/seed/yogamat/400/400"], "variants": [
        {"title": "Default", "price": "49.99", "sku": "FG-YM-01", "qty": 60},
    ]},
    {"merchant_idx": 4, "title": "Resistance Band Set", "description": "5-piece resistance band set with different tension levels. Includes carry bag.", "category": "Fitness", "images": ["https://picsum.photos/seed/bands/400/400"], "variants": [
        {"title": "5-Piece Set", "price": "24.99", "sku": "FG-RB-05", "qty": 100},
    ]},
]


class Command(BaseCommand):
    help = "Seed the database with mock data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # ── Create demo company ──────────────────────────────────────
        demo_company, created = Company.objects.get_or_create(
            contact_email="demo@acme.com",
            defaults={
                "name": "Acme Demo",
                "password_hash": make_password("demo1234"),
                "client_id": "shopagent_test_demo",
                "secret_key": "sk_test_demo_secret_key_for_local_development_only",
            },
        )
        if created:
            self.stdout.write(f"  Created demo company: {demo_company.name}")
            self.stdout.write(f"    Client ID:  {demo_company.client_id}")
            self.stdout.write(f"    Secret Key: {demo_company.secret_key}")
        else:
            self.stdout.write(f"  Demo company exists: {demo_company.name}")

        # ── Create merchants ─────────────────────────────────────────
        merchant_objs = []
        for m in MERCHANTS:
            merchant, created = Merchant.objects.get_or_create(
                email=m["email"],
                defaults={"business_name": m["business_name"], "country": m.get("country", "US")},
            )
            if created:
                merchant.set_password(m["password"])
                merchant.save()
                self.stdout.write(f"  Created merchant: {merchant.business_name} ({merchant.country} → {merchant.currency})")
            else:
                self.stdout.write(f"  Merchant exists: {merchant.business_name} ({merchant.country} → {merchant.currency})")
            merchant_objs.append(merchant)

        # ── Create products ──────────────────────────────────────────
        for p in PRODUCTS:
            merchant = merchant_objs[p["merchant_idx"]]
            product, created = Product.objects.get_or_create(
                merchant=merchant,
                title=p["title"],
                defaults={
                    "description": p["description"],
                    "category": p["category"],
                    "images": p["images"],
                },
            )
            if created:
                self.stdout.write(f"  Created product: {p['title']}")
                for v in p["variants"]:
                    Variant.objects.create(
                        product=product,
                        title=v["title"],
                        price=Decimal(v["price"]),
                        currency=merchant.currency,
                        sku=v["sku"],
                        available_qty=v["qty"],
                    )

        # Note: variant currencies are NOT force-updated here to avoid
        # overwriting currencies set by Shopify sync or manual edits.

        # ── Create demo users under demo company ────────────────────
        demo_users = [
            {
                "external_user_id": "demo@acme.com",
                "display_name": "Demo User",
                "email": "demo@acme.com",
                "password": "demo1234",
            },
            {
                "external_user_id": "alice@example.com",
                "display_name": "Alice Johnson",
                "email": "alice@example.com",
                "password": "demo1234",
            },
        ]

        for u in demo_users:
            user, created = User.objects.get_or_create(
                company=demo_company,
                external_user_id=u["external_user_id"],
                defaults={
                    "display_name": u["display_name"],
                    "email": u["email"],
                    "password_hash": make_password(u["password"]),
                },
            )
            if created:
                self.stdout.write(f"  Created demo user: {u['display_name']} ({u['email']})")
                # Add a default shipping address for the first user
                if u["external_user_id"] == "demo@acme.com":
                    ShippingAddress.objects.create(
                        user=user,
                        full_name="Demo User",
                        address_line_1="123 Demo Street",
                        city="San Francisco",
                        state="CA",
                        postal_code="94102",
                        country="US",
                        is_default=True,
                    )

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Created {len(merchant_objs)} merchants, "
            f"{Product.objects.count()} products, "
            f"{Variant.objects.count()} variants, "
            f"1 demo company, {len(demo_users)} demo users."
        ))

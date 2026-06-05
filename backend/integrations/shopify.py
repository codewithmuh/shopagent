"""Shopify integration client.

For MVP: validates connection and syncs products.
Uses Shopify Admin REST API.
"""
import logging
import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def validate_shopify_connection(shop_domain: str, access_token: str) -> tuple[bool, str]:
    """Validate a Shopify connection by fetching shop info."""
    # Sanity check: domain shouldn't look like a token
    if shop_domain.startswith("shpat_") or "." not in shop_domain:
        return False, "Invalid shop domain. Use your-store.myshopify.com format."
    try:
        url = f"https://{shop_domain}/admin/api/2024-01/shop.json"
        headers = {"X-Shopify-Access-Token": access_token}
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            return True, ""
        if resp.status_code == 401:
            return False, "Invalid access token. Check your Admin API access token."
        if resp.status_code == 404:
            return False, "Store not found. Check your shop domain."
        return False, f"Shopify returned status {resp.status_code}"
    except requests.RequestException as e:
        return False, f"Connection failed: Could not reach {shop_domain}. Check the domain is correct."


def _get_shop_currency(shop_domain: str, token: str) -> str:
    """Fetch the store's currency from Shopify shop info."""
    try:
        url = f"https://{shop_domain}/admin/api/2024-01/shop.json"
        headers = {"X-Shopify-Access-Token": token}
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        return resp.json().get("shop", {}).get("currency", "USD")
    except Exception:
        return "USD"


def sync_shopify_products(connection):
    """Sync products from Shopify into our database."""
    from products.models import Product, Variant

    shop_domain = connection.shop_domain
    token = connection.access_token_encrypted  # TODO: decrypt in production
    merchant = connection.merchant

    # Get the store's actual currency from Shopify
    shop_currency = _get_shop_currency(shop_domain, token)

    try:
        url = f"https://{shop_domain}/admin/api/2024-01/products.json?limit=250"
        headers = {"X-Shopify-Access-Token": token}
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        for sp in data.get("products", []):
            # Build rich image objects
            images = []
            for img in sp.get("images", []):
                images.append({
                    "src": img["src"],
                    "alt": img.get("alt") or "",
                    "position": img.get("position", 1),
                    "width": img.get("width"),
                    "height": img.get("height"),
                    "shopify_image_id": str(img.get("id", "")),
                    "variant_ids": [str(vid) for vid in img.get("variant_ids", [])],
                })

            # Parse tags string into list
            tags_raw = sp.get("tags", "")
            tags = [t.strip() for t in tags_raw.split(",") if t.strip()] if tags_raw else []

            product, _ = Product.objects.update_or_create(
                merchant=merchant,
                external_product_id=str(sp["id"]),
                defaults={
                    "title": sp["title"],
                    # Shopify sends explicit nulls (not missing keys) for empty
                    # fields, so `.get(k, "")` isn't enough — coerce None to "".
                    "description": sp.get("body_html") or "",
                    "brand": sp.get("vendor") or "",
                    "tags": tags,
                    "images": images,
                    "category": sp.get("product_type") or "",
                    "is_active": sp.get("status", "active") == "active",
                },
            )

            # Upload images to S3 if configured
            if settings.AWS_ACCESS_KEY_ID and images:
                from integrations.s3 import upload_product_images
                s3_images = upload_product_images(images, str(merchant.id), str(product.id))
                product.images = s3_images
                product.save(update_fields=["images"])
            for sv in sp.get("variants", []):
                Variant.objects.update_or_create(
                    product=product,
                    external_variant_id=str(sv["id"]),
                    defaults={
                        "title": sv.get("title", "Default"),
                        "price": sv.get("price", "0.00"),
                        "compare_at_price": sv.get("compare_at_price") or None,
                        "currency": shop_currency,
                        "sku": sv.get("sku") or "",
                        "barcode": sv.get("barcode") or "",
                        "weight": sv.get("weight") or None,
                        "weight_unit": sv.get("weight_unit") or "",
                        "available_qty": sv.get("inventory_quantity", 0),
                    },
                )

        connection.last_synced_at = timezone.now()
        connection.save()
        logger.info(f"Synced products for {shop_domain}")

    except requests.RequestException as e:
        logger.error(f"Shopify sync failed for {shop_domain}: {e}")


def _get_inventory_item_id(shop_domain: str, token: str, variant_external_id: str) -> str | None:
    """Get the inventory_item_id for a Shopify variant."""
    try:
        url = f"https://{shop_domain}/admin/api/2024-01/variants/{variant_external_id}.json"
        headers = {"X-Shopify-Access-Token": token}
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        return str(resp.json().get("variant", {}).get("inventory_item_id", ""))
    except Exception as e:
        logger.error(f"Failed to get inventory_item_id for variant {variant_external_id}: {e}")
        return None


def _get_location_id(shop_domain: str, token: str) -> str | None:
    """Get the primary location ID for a Shopify store."""
    try:
        url = f"https://{shop_domain}/admin/api/2024-01/locations.json"
        headers = {"X-Shopify-Access-Token": token}
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        locations = resp.json().get("locations", [])
        if locations:
            return str(locations[0]["id"])
        return None
    except Exception as e:
        logger.error(f"Failed to get location for {shop_domain}: {e}")
        return None


def _adjust_shopify_inventory(connection, variant_external_id: str, adjustment: int) -> bool:
    """Adjust inventory level in Shopify by a given amount (negative to decrement)."""
    shop_domain = connection.shop_domain
    token = connection.access_token_encrypted

    inventory_item_id = _get_inventory_item_id(shop_domain, token, variant_external_id)
    if not inventory_item_id:
        return False

    location_id = _get_location_id(shop_domain, token)
    if not location_id:
        return False

    try:
        url = f"https://{shop_domain}/admin/api/2024-01/inventory_levels/adjust.json"
        headers = {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
        }
        payload = {
            "location_id": int(location_id),
            "inventory_item_id": int(inventory_item_id),
            "available_adjustment": adjustment,
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        logger.info(f"Shopify inventory adjusted for variant {variant_external_id} by {adjustment}")
        return True
    except Exception as e:
        logger.error(f"Shopify inventory adjust failed for variant {variant_external_id}: {e}")
        return False


def decrement_shopify_inventory(connection, variant_external_id: str, qty: int) -> bool:
    """Decrement inventory in Shopify."""
    return _adjust_shopify_inventory(connection, variant_external_id, -qty)


def increment_shopify_inventory(connection, variant_external_id: str, qty: int) -> bool:
    """Rollback: increment inventory back in Shopify."""
    return _adjust_shopify_inventory(connection, variant_external_id, qty)

"""Agent tool definitions for Claude's tool-use API.

Each tool is a function the AI agent can call to interact with the backend.
"""
import logging
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings

from products.models import Product, Variant
from users.models import User, ShippingAddress
from orders.models import Order

logger = logging.getLogger(__name__)

# ── Currency conversion ───────────────────────────────────────────────
# Merchants may price products in different currencies; we normalize them
# to a single display currency (DEFAULT_CURRENCY, default "USD") so the
# shopper sees consistent pricing. Rates are the approximate USD value of
# one unit of each currency — update periodically. Override the display
# currency with the DEFAULT_CURRENCY env var.
_USD_PER_UNIT = {
    "USD": Decimal("1"),
    "GBP": Decimal("1.27"),
    "EUR": Decimal("1.08"),
    "AED": Decimal("0.272"),
    "SAR": Decimal("0.266"),
    "PKR": Decimal("0.0036"),
    "INR": Decimal("0.012"),
    "JPY": Decimal("0.0064"),
    "CNY": Decimal("0.138"),
    "AUD": Decimal("0.66"),
    "CAD": Decimal("0.74"),
}


def target_currency() -> str:
    """The display currency all prices are normalized to."""
    return getattr(settings, "DEFAULT_CURRENCY", "USD")


def _convert_currency(price: Decimal, from_currency: str) -> Decimal:
    """Convert a price into DEFAULT_CURRENCY. Returns original if either currency is unknown."""
    target = target_currency()
    if from_currency == target:
        return price
    from_rate = _USD_PER_UNIT.get(from_currency)
    target_rate = _USD_PER_UNIT.get(target)
    if not from_rate or not target_rate:
        return price
    return (price * from_rate / target_rate).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

# Tool schemas for Claude API
TOOL_DEFINITIONS = [
    {
        "name": "search_products",
        "description": "Search for products by specific keywords or criteria. Use this when the user has a clear idea of what they want (e.g. 'running shoes', 'headphones under $50'). Do NOT use for vague requests like 'show me everything' — use browse_categories instead to help the user narrow down.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Specific search query (product name, type, or category). Be specific — avoid broad single words.",
                },
                "max_price": {
                    "type": "number",
                    "description": "Maximum price filter (optional)",
                },
                "category": {
                    "type": "string",
                    "description": "Category filter (optional)",
                },
                "merchant_name": {
                    "type": "string",
                    "description": "Filter by merchant/store name (optional)",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "browse_categories",
        "description": "Get available product categories and counts. Use this when the user wants to browse or asks vague questions like 'what do you have' or 'show me products'. Returns categories with product counts to help guide the conversation.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_product_details",
        "description": "Get full details of a specific product including all variants, prices, and availability.",
        "input_schema": {
            "type": "object",
            "properties": {
                "product_id": {
                    "type": "string",
                    "description": "The UUID of the product",
                },
            },
            "required": ["product_id"],
        },
    },
    {
        "name": "create_order",
        "description": "Place an order for a product. IMPORTANT: Before calling this, you MUST have confirmed the delivery address with the user. Pass the shipping_address_id of the confirmed address.",
        "input_schema": {
            "type": "object",
            "properties": {
                "variant_id": {
                    "type": "string",
                    "description": "The UUID of the product variant to purchase",
                },
                "qty": {
                    "type": "integer",
                    "description": "Quantity to order (default 1)",
                },
                "shipping_address_id": {
                    "type": "string",
                    "description": "The UUID of the shipping address to deliver to. Always confirm the address with the user first.",
                },
            },
            "required": ["variant_id"],
        },
    },
    {
        "name": "get_order_status",
        "description": "Check the status of an existing order.",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "The UUID of the order",
                },
            },
            "required": ["order_id"],
        },
    },
    {
        "name": "get_user_orders",
        "description": "Get all recent orders for the current user.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_shipping_address",
        "description": "Get the user's saved shipping addresses.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "save_shipping_address",
        "description": "Save a new shipping address for the user. Always ask for address_type (home/office/other) and optionally a custom label.",
        "input_schema": {
            "type": "object",
            "properties": {
                "full_name": {"type": "string", "description": "Full name of recipient"},
                "address_line_1": {"type": "string", "description": "Street address"},
                "address_line_2": {"type": "string", "description": "Apartment, suite, etc. (optional)"},
                "city": {"type": "string", "description": "City"},
                "state": {"type": "string", "description": "State/Province"},
                "postal_code": {"type": "string", "description": "ZIP/Postal code"},
                "country": {"type": "string", "description": "Country (default: US)"},
                "phone": {"type": "string", "description": "Phone number (optional)"},
                "address_type": {"type": "string", "enum": ["home", "office", "other"], "description": "Type of address: home, office, or other"},
                "label": {"type": "string", "description": "Custom label for the address (optional), e.g. 'Mom's house', 'Downtown office'"},
            },
            "required": ["full_name", "address_line_1", "city", "state", "postal_code", "address_type"],
        },
    },
]


def execute_tool(tool_name: str, tool_input: dict, session_context: dict = None) -> str:
    """Execute a tool and return the result as a string."""
    handlers = {
        "search_products": _search_products,
        "browse_categories": _browse_categories,
        "get_product_details": _get_product_details,
        "create_order": _create_order,
        "get_order_status": _get_order_status,
        "get_user_orders": _get_user_orders,
        "get_shipping_address": _get_shipping_address,
        "save_shipping_address": _save_shipping_address,
    }
    handler = handlers.get(tool_name)
    if not handler:
        return f"Unknown tool: {tool_name}"
    try:
        return handler(session_context=session_context, **tool_input)
    except Exception as e:
        logger.exception(f"Error executing tool {tool_name}")
        return f"Error executing {tool_name}: {str(e)}"


def _get_user_from_context(session_context):
    """Helper to get User object from session context."""
    if not session_context or not session_context.get("user_id"):
        return None
    try:
        return User.objects.get(id=session_context["user_id"])
    except User.DoesNotExist:
        return None


def _get_company_from_context(session_context):
    """Helper to get Company object from session context."""
    if not session_context or not session_context.get("company_id"):
        return None
    from companies.models import Company
    try:
        return Company.objects.get(id=session_context["company_id"])
    except Company.DoesNotExist:
        return None


def _browse_categories(session_context: dict = None) -> str:
    """Return available product categories with counts."""
    from django.db.models import Count

    categories = (
        Product.objects
        .filter(is_active=True)
        .exclude(category="")
        .values("category")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    if not categories:
        return "No product categories available right now."

    lines = []
    total = 0
    for cat in categories:
        lines.append(f"- {cat['category']}: {cat['count']} products")
        total += cat["count"]

    return f"Available categories ({total} products total):\n" + "\n".join(lines)


def _search_products(query: str, max_price: float = None, category: str = None,
                     merchant_name: str = None, session_context: dict = None) -> str:
    from django.db.models import Q

    base_qs = Product.objects.filter(
        is_active=True,
    ).prefetch_related("variants")

    if category:
        base_qs = base_qs.filter(category__icontains=category)
    if max_price:
        base_qs = base_qs.filter(variants__price__lte=max_price).distinct()
    if merchant_name:
        base_qs = base_qs.filter(merchant__business_name__icontains=merchant_name)

    # Step 1: Try exact full-query match on title/brand first
    exact_q = Q(title__icontains=query) | Q(brand__icontains=query)
    exact_matches = base_qs.filter(exact_q).distinct()

    if exact_matches.exists():
        # If we found exact matches, return only those (no word-splitting noise)
        products = exact_matches[:10]
    else:
        # Step 2: Fall back to individual word matching
        words = [w for w in query.split() if len(w) >= 3]
        if words:
            word_q = Q()
            for word in words:
                word_q |= Q(title__icontains=word) | Q(brand__icontains=word) | Q(category__icontains=word)
            products = base_qs.filter(word_q).distinct()[:10]
        else:
            # Very short query, try category too
            fallback_q = Q(title__icontains=query) | Q(category__icontains=query) | Q(brand__icontains=query)
            products = base_qs.filter(fallback_q).distinct()[:10]
    if not products:
        return "No products found matching your search."

    import json as _json

    # Sort products: in-stock first (any variant with available_qty > 0)
    def _stock_sort_key(product):
        max_avail = max((v.available_qty for v in product.variants.all()), default=0)
        return (0 if max_avail > 0 else 1, -max_avail)

    products = sorted(products, key=_stock_sort_key)

    results = []
    for p in products:
        variant_info = []
        for v in p.variants.all():
            converted_price = _convert_currency(v.price, v.currency)
            variant_info.append({
                "id": str(v.id),
                "title": v.title,
                "price": str(converted_price),
                "currency": target_currency(),
                "available": v.available_qty,
            })
        # Extract primary image src (handles both old URL strings and new rich objects)
        primary_image = None
        if p.images:
            first = p.images[0]
            primary_image = first["src"] if isinstance(first, dict) else first

        results.append({
            "id": str(p.id),
            "title": p.title,
            "brand": p.brand or "",
            "merchant": p.merchant.business_name,
            "image": primary_image,
            "category": p.category or "",
            "tags": p.tags or [],
            "description": (p.description or "")[:200],
            "variants": variant_info,
        })

    if not results:
        return "No products found matching your search."

    return f"Found {len(results)} products:\n\n" + _json.dumps(results, indent=2)


def _get_product_details(product_id: str, session_context: dict = None) -> str:
    try:
        product = Product.objects.prefetch_related("variants").get(id=product_id)
    except Product.DoesNotExist:
        return "Product not found."

    import json as _json

    variant_list = []
    for v in product.variants.all():
        converted_price = _convert_currency(v.price, v.currency)
        variant_list.append({
            "id": str(v.id),
            "title": v.title,
            "price": str(converted_price),
            "currency": target_currency(),
            "sku": v.sku,
            "available": v.available_qty,
        })

    if not variant_list:
        return "This product has no variants available."

    # Extract image URLs (handles both old URL strings and new rich objects)
    all_images = []
    for img in (product.images or []):
        all_images.append(img["src"] if isinstance(img, dict) else img)
    primary_image = all_images[0] if all_images else None

    product_data = {
        "id": str(product.id),
        "title": product.title,
        "brand": product.brand or "",
        "merchant": product.merchant.business_name,
        "category": product.category or "",
        "tags": product.tags or [],
        "description": product.description or "",
        "image": primary_image,
        "images": all_images,
        "variants": variant_list,
    }

    return _json.dumps(product_data, indent=2)


def _create_order(variant_id: str, qty: int = 1, shipping_address_id: str = None,
                  session_context: dict = None) -> str:
    from django.db import transaction

    user = _get_user_from_context(session_context)
    if not user:
        return "Error: User not identified. Cannot place order."

    company = _get_company_from_context(session_context)

    try:
        variant = Variant.objects.select_related("product__merchant").get(id=variant_id)
    except Variant.DoesNotExist:
        return "Error: Product variant not found."

    total = variant.price * qty

    # Resolve shipping address
    address = None
    if shipping_address_id:
        try:
            address = ShippingAddress.objects.get(id=shipping_address_id, user=user)
        except ShippingAddress.DoesNotExist:
            return "Error: Shipping address not found."
    else:
        address = ShippingAddress.objects.filter(user=user, is_default=True).first()
        if not address:
            address = ShippingAddress.objects.filter(user=user).first()

    if not address:
        return "Error: No shipping address found. Please provide a shipping address first using the save_shipping_address tool."

    # Lock inventory (DB + Shopify)
    with transaction.atomic():
        v = Variant.objects.select_for_update().get(id=variant_id)
        if v.available_qty < qty:
            return f"Error: Insufficient inventory. Only {v.available_qty} available."
        v.available_qty -= qty
        v.save()

    # Also decrement in Shopify if this is a Shopify-synced variant
    if variant.external_variant_id:
        _sync_shopify_decrement(variant, qty)

    order = Order.objects.create(
        user=user,
        merchant=variant.product.merchant,
        company=company,
        variant=variant,
        qty=qty,
        amount=total,
        currency=variant.currency,
        status=Order.Status.INVENTORY_LOCKED,
        shipping_address=address,
    )

    # Payment: use webhook for companies with webhook_url, mock for demo
    if company and company.webhook_url:
        return _process_webhook_payment(company, user, order, variant, qty, total)
    else:
        return _process_mock_payment(user, order, variant, qty, total)


def _process_webhook_payment(company, user, order, variant, qty, total):
    """Process payment via company webhook."""
    from django.db import transaction
    from integrations.webhooks import send_webhook, WebhookError

    try:
        # Step 1: Balance check
        order.status = Order.Status.BALANCE_CHECK_PENDING
        order.save()

        balance_response = send_webhook(company, "balance_check", {
            "order_id": str(order.id),
            "user_id": user.external_user_id,
            "amount": str(total),
            "currency": order.currency,
            "product": variant.product.title,
            "variant": variant.title,
            "qty": qty,
        })

        approved = balance_response.get("approved") or balance_response.get("success")
        if not approved:
            reason = balance_response.get("reason", "Insufficient balance")
            _rollback_inventory(variant.id, qty)
            order.status = Order.Status.FAILED
            order.save()
            return f"Error: Payment declined — {reason}"

        # Step 2: Charge
        order.status = Order.Status.PAYMENT_PENDING
        order.save()

        charge_response = send_webhook(company, "charge", {
            "order_id": str(order.id),
            "user_id": user.external_user_id,
            "amount": str(total),
            "currency": order.currency,
            "token_address": "0x7fcd481cf6808043fa5ada1969803edd72637d02",
            "token": "USDC",
            "network": "Base",
        })

        if charge_response.get("success"):
            order.status = Order.Status.PAID
            order.external_transaction_id = charge_response.get("transaction_id") or charge_response.get("tx_hash", "")
            order.save()
            _schedule_follow_up(order)
            return (
                f"Order placed successfully!\n"
                f"Order ID: {order.id}\n"
                f"Product: {variant.product.title} ({variant.title})\n"
                f"Qty: {qty}\n"
                f"Total: {variant.currency} {total:.2f}\n"
                f"Status: PAID\n"
                f"Transaction: {order.external_transaction_id or 'confirmed'}"
            )
        else:
            _rollback_inventory(variant.id, qty)
            order.status = Order.Status.FAILED
            order.save()
            return "Error: Payment failed. Inventory has been restored."

    except WebhookError as e:
        _rollback_inventory(variant.id, qty)
        order.status = Order.Status.FAILED
        order.save()
        logger.error(f"Webhook error for order {order.id}: {e}")
        return f"Error: Payment processing failed — {str(e)}"


def _schedule_follow_up(order):
    """Schedule a delivery follow-up 3 days after a PAID order."""
    from datetime import timedelta
    from django.utils import timezone
    from orders.models import OrderFollowUp
    try:
        OrderFollowUp.objects.get_or_create(
            order=order,
            defaults={"send_after": timezone.now() + timedelta(days=3)},
        )
    except Exception:
        logger.exception("Failed to schedule follow-up for order %s", order.id)


def _process_mock_payment(user, order, variant, qty, total):
    """Auto-approve payment for demo company (no webhook configured)."""
    order.status = Order.Status.PAID
    order.external_transaction_id = f"demo_{order.id}"
    order.save()
    _schedule_follow_up(order)
    addr = order.shipping_address
    addr_info = ""
    if addr:
        type_display = addr.label or getattr(addr, 'get_address_type_display', lambda: addr.address_type.capitalize())()
        addr_info = (
            f"\nDelivering to: {type_display}\n"
            f"  {addr.full_name}, {addr.address_line_1}, {addr.city}, {addr.state} {addr.postal_code}"
        )
    return (
        f"Order placed successfully!\n"
        f"Order ID: {order.id}\n"
        f"Product: {variant.product.title} ({variant.title})\n"
        f"Qty: {qty}\n"
        f"Total: {variant.currency} {total:.2f}\n"
        f"Status: PAID"
        f"{addr_info}"
    )


def _sync_shopify_decrement(variant, qty):
    """Decrement inventory in Shopify for synced variants."""
    from merchants.models import MerchantConnection
    from integrations.shopify import decrement_shopify_inventory
    try:
        connection = MerchantConnection.objects.get(
            merchant=variant.product.merchant,
            source_type=MerchantConnection.SourceType.SHOPIFY,
            is_active=True,
        )
        decrement_shopify_inventory(connection, variant.external_variant_id, qty)
    except MerchantConnection.DoesNotExist:
        pass
    except Exception as e:
        logger.error(f"Shopify inventory decrement failed: {e}")


def _sync_shopify_increment(variant_id, qty):
    """Rollback: increment inventory back in Shopify for synced variants."""
    from merchants.models import MerchantConnection
    from integrations.shopify import increment_shopify_inventory
    try:
        variant = Variant.objects.select_related("product__merchant").get(id=variant_id)
        if not variant.external_variant_id:
            return
        connection = MerchantConnection.objects.get(
            merchant=variant.product.merchant,
            source_type=MerchantConnection.SourceType.SHOPIFY,
            is_active=True,
        )
        increment_shopify_inventory(connection, variant.external_variant_id, qty)
    except (Variant.DoesNotExist, MerchantConnection.DoesNotExist):
        pass
    except Exception as e:
        logger.error(f"Shopify inventory rollback failed: {e}")


def _rollback_inventory(variant_id, qty):
    """Restore inventory after a failed order."""
    from django.db import transaction
    with transaction.atomic():
        v = Variant.objects.select_for_update().get(id=variant_id)
        v.available_qty += qty
        v.save()
    # Also rollback in Shopify
    _sync_shopify_increment(variant_id, qty)


def _get_order_status(order_id: str, session_context: dict = None) -> str:
    try:
        order = Order.objects.select_related(
            "variant__product", "merchant"
        ).get(id=order_id)
        return (
            f"Order {order.id}\n"
            f"Product: {order.variant.product.title}\n"
            f"Amount: {order.currency} {order.amount}\n"
            f"Status: {order.status}\n"
            f"Created: {order.created_at.strftime('%Y-%m-%d %H:%M')}"
        )
    except Order.DoesNotExist:
        return "Order not found."


def _get_user_orders(session_context: dict = None) -> str:
    user = _get_user_from_context(session_context)
    if not user:
        return "Error: User not identified."

    orders = Order.objects.filter(user=user).select_related(
        "variant__product", "merchant"
    ).order_by("-created_at")[:10]

    if not orders:
        return "No orders found."

    lines = []
    for o in orders:
        lines.append(
            f"- Order {str(o.id)[:8]}... | {o.variant.product.title} | "
            f"{o.currency} {o.amount} | {o.status} | {o.created_at.strftime('%Y-%m-%d')}"
        )
    return "Your recent orders:\n" + "\n".join(lines)


def _get_shipping_address(session_context: dict = None) -> str:
    user = _get_user_from_context(session_context)
    if not user:
        return "Error: User not identified."

    addresses = ShippingAddress.objects.filter(user=user).order_by("-is_default", "-created_at")
    if not addresses:
        return "No shipping addresses on file."

    lines = []
    for addr in addresses:
        default_mark = " (default)" if addr.is_default else ""
        type_display = addr.label or getattr(addr, 'get_address_type_display', lambda: addr.address_type.capitalize())()
        lines.append(
            f"- ID: {addr.id}\n"
            f"  Type: {type_display}{default_mark}\n"
            f"  {addr.full_name}\n"
            f"  {addr.address_line_1}"
            f"{', ' + addr.address_line_2 if addr.address_line_2 else ''}\n"
            f"  {addr.city}, {addr.state} {addr.postal_code}\n"
            f"  {addr.country}"
            f"{' | Phone: ' + addr.phone if addr.phone else ''}"
        )
    return "Shipping addresses:\n\n" + "\n\n".join(lines)


def _save_shipping_address(full_name: str, address_line_1: str, city: str,
                           state: str, postal_code: str, address_type: str = "home",
                           address_line_2: str = "", country: str = "US",
                           phone: str = "", label: str = "",
                           session_context: dict = None) -> str:
    user = _get_user_from_context(session_context)
    if not user:
        return "Error: User not identified."

    is_first = not ShippingAddress.objects.filter(user=user).exists()

    # Validate address_type
    valid_types = ["home", "office", "other"]
    if address_type not in valid_types:
        address_type = "home"

    addr = ShippingAddress.objects.create(
        user=user,
        address_type=address_type,
        label=label,
        full_name=full_name,
        address_line_1=address_line_1,
        address_line_2=address_line_2,
        city=city,
        state=state,
        postal_code=postal_code,
        country=country,
        phone=phone,
        is_default=is_first,
    )

    type_display = label or address_type.capitalize()
    return (
        f"Shipping address saved successfully!\n"
        f"ID: {addr.id}\n"
        f"Type: {type_display}{' (default)' if addr.is_default else ''}\n"
        f"{addr.full_name}\n"
        f"{addr.address_line_1}"
        f"{', ' + addr.address_line_2 if addr.address_line_2 else ''}\n"
        f"{addr.city}, {addr.state} {addr.postal_code}, {addr.country}"
        f"{' | Phone: ' + addr.phone if addr.phone else ''}"
    )

from django.db.models import Sum
from rest_framework import status, generics
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Merchant, MerchantConnection
from .serializers import (
    MerchantSignupSerializer,
    MerchantSerializer,
    MerchantConnectionSerializer,
    ShopifyConnectSerializer,
)
from integrations.shopify import validate_shopify_connection, sync_shopify_products
from products.models import Product, Variant
from orders.models import Order


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def merchant_signup(request):
    serializer = MerchantSignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    merchant = serializer.save()
    refresh = RefreshToken.for_user(merchant)
    return Response(
        {
            "merchant": MerchantSerializer(merchant).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def merchant_login(request):
    email = request.data.get("email")
    password = request.data.get("password")
    try:
        merchant = Merchant.objects.get(email=email)
    except Merchant.DoesNotExist:
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )
    if not merchant.check_password(password):
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )
    refresh = RefreshToken.for_user(merchant)
    return Response(
        {
            "merchant": MerchantSerializer(merchant).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
        }
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def merchant_profile(request):
    if request.method == "PATCH":
        allowed_fields = {"business_name", "country"}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = MerchantSerializer(request.user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Cascade currency to all variants when country changes
        if "country" in data:
            Variant.objects.filter(product__merchant=request.user).update(
                currency=request.user.currency
            )
        return Response(MerchantSerializer(request.user).data)
    return Response(MerchantSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def shopify_connect(request):
    serializer = ShopifyConnectSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    shop_domain = serializer.validated_data["shop_domain"]
    token = serializer.validated_data["admin_access_token"]

    is_valid, error = validate_shopify_connection(shop_domain, token)
    if not is_valid:
        return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

    connection, created = MerchantConnection.objects.update_or_create(
        merchant=request.user,
        shop_domain=shop_domain,
        defaults={
            "source_type": MerchantConnection.SourceType.SHOPIFY,
            "access_token_encrypted": token,  # TODO: encrypt in production
            "is_active": True,
        },
    )

    sync_shopify_products(connection)

    return Response(
        {
            "connection": MerchantConnectionSerializer(connection).data,
            "message": "Shopify store connected and products synced.",
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def merchant_dashboard_stats(request):
    merchant = request.user
    total_products = Product.objects.filter(merchant=merchant).count()
    active_products = Product.objects.filter(merchant=merchant, is_active=True).count()
    total_orders = Order.objects.filter(merchant=merchant).count()
    revenue = Order.objects.filter(
        merchant=merchant, status=Order.Status.PAID
    ).aggregate(total=Sum("amount"))["total"] or 0
    return Response({
        "total_products": total_products,
        "active_products": active_products,
        "total_orders": total_orders,
        "revenue": float(revenue),
        "country": merchant.country,
        "currency": merchant.currency,
    })


class MerchantConnectionListView(generics.ListAPIView):
    serializer_class = MerchantConnectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MerchantConnection.objects.filter(merchant=self.request.user)

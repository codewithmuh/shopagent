from rest_framework import generics
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import Product
from .serializers import ProductSerializer, ProductSearchSerializer


class MerchantProductListView(generics.ListAPIView):
    """Products for the authenticated merchant's portal."""
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(
            merchant=self.request.user, is_active=True
        ).prefetch_related("variants")


class CatalogSearchView(generics.ListAPIView):
    """Public product search across all merchants (used by agent)."""
    serializer_class = ProductSearchSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).prefetch_related("variants")
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(title__icontains=q) | Q(description__icontains=q) | Q(category__icontains=q)
            )
        merchant_id = self.request.query_params.get("merchant_id")
        if merchant_id:
            qs = qs.filter(merchant_id=merchant_id)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__icontains=category)
        max_price = self.request.query_params.get("max_price")
        if max_price:
            qs = qs.filter(variants__price__lte=max_price).distinct()
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    """Public product detail."""
    serializer_class = ProductSearchSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
    queryset = Product.objects.filter(is_active=True).prefetch_related("variants")

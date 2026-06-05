from rest_framework import generics
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Order
from .serializers import OrderSerializer


class MerchantOrderListView(generics.ListAPIView):
    """Orders for the authenticated merchant's portal."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            merchant=self.request.user
        ).select_related("variant__product", "user", "merchant")


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def order_detail(request, pk):
    try:
        order = Order.objects.select_related(
            "variant__product", "user", "merchant"
        ).get(id=pk)
    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND
        )
    return Response(OrderSerializer(order).data)

from django.urls import path
from . import views

urlpatterns = [
    path("<uuid:pk>/", views.order_detail, name="order-detail"),
    path("merchant/", views.MerchantOrderListView.as_view(), name="merchant-orders"),
]

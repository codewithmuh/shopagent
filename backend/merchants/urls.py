from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path("signup/", views.merchant_signup, name="merchant-signup"),
    path("login/", views.merchant_login, name="merchant-login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("profile/", views.merchant_profile, name="merchant-profile"),
    path("dashboard/stats/", views.merchant_dashboard_stats, name="merchant-dashboard-stats"),
    path("shopify/connect/", views.shopify_connect, name="shopify-connect"),
    path(
        "connections/",
        views.MerchantConnectionListView.as_view(),
        name="merchant-connections",
    ),
]

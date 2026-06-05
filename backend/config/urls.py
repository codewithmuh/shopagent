from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("api/health/", health_check),
    path("admin/", admin.site.urls),
    # B2B API (API key authenticated)
    path("api/v1/", include("companies.urls")),
    # Portal auth (company dashboard)
    path("api/portal/", include("companies.portal_urls")),
    # Existing endpoints
    path("api/merchant/", include("merchants.urls")),
    path("api/catalog/", include("products.urls")),
    path("api/users/", include("users.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/agent/", include("agent.urls")),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

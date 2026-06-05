from django.urls import path
from . import views

urlpatterns = [
    path("search/", views.CatalogSearchView.as_view(), name="catalog-search"),
    path("products/<uuid:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
    path("merchant/products/", views.MerchantProductListView.as_view(), name="merchant-products"),
]

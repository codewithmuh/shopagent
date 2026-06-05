from django.urls import path
from . import views

# B2B API endpoints (authenticated via API keys)
urlpatterns = [
    path("chat/history/", views.ChatHistoryView.as_view(), name="b2b-chat-history"),
    path("users/", views.UserListCreateView.as_view(), name="b2b-user-list-create"),
    path("users/<str:user_id>/", views.UserDetailView.as_view(), name="b2b-user-detail"),
    path("users/<str:user_id>/addresses/", views.UserAddressView.as_view(), name="b2b-user-addresses"),
    path("users/<str:user_id>/orders/", views.UserOrdersView.as_view(), name="b2b-user-orders"),
]

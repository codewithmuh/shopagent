from django.urls import path
from . import views

# Portal auth endpoints (for company dashboard)
urlpatterns = [
    path("register/", views.portal_register, name="portal-register"),
    path("login/", views.portal_login, name="portal-login"),
    path("profile/", views.portal_profile, name="portal-profile"),
    path("usage/", views.portal_usage, name="portal-usage"),
]

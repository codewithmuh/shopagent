from django.urls import path
from . import views

urlpatterns = [
    path("demo/signup/", views.demo_signup, name="demo-signup"),
    path("demo/login/", views.demo_login, name="demo-login"),
]

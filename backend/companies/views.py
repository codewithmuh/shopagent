import jwt
from datetime import datetime, timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .authentication import CompanyAPIKeyAuthentication
from .models import Company, APIUsageLog
from .serializers import (
    CompanyRegisterSerializer,
    CompanyLoginSerializer,
    CompanyProfileSerializer,
    CompanyUpdateSerializer,
    UsageSummarySerializer,
)

# ─── Helper: JWT for portal sessions ─────────────────────────────────────────

PORTAL_TOKEN_LIFETIME = timedelta(hours=24)


def _make_portal_token(company):
    payload = {
        "company_id": str(company.id),
        "exp": datetime.utcnow() + PORTAL_TOKEN_LIFETIME,
        "type": "portal",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def _decode_portal_token(token):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "portal":
            return None
        return payload["company_id"]
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


class PortalAuthentication:
    """Mixin to authenticate portal requests via X-Portal-Token header."""

    @staticmethod
    def get_company(request):
        token = request.META.get("HTTP_X_PORTAL_TOKEN", "")
        if not token:
            return None
        company_id = _decode_portal_token(token)
        if not company_id:
            return None
        try:
            return Company.objects.get(id=company_id, is_active=True)
        except Company.DoesNotExist:
            return None


# ─── Portal Auth Endpoints ────────────────────────────────────────────────────


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def portal_register(request):
    """Company self-registration. Creates company + auto-generates API keys."""
    serializer = CompanyRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    if Company.objects.filter(contact_email=serializer.validated_data["contact_email"]).exists():
        return Response(
            {"error": "A company with this email already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    company = Company(
        name=serializer.validated_data["name"],
        contact_email=serializer.validated_data["contact_email"],
        password_hash=make_password(serializer.validated_data["password"]),
    )
    company.save()

    token = _make_portal_token(company)

    return Response(
        {
            "token": token,
            "company": CompanyProfileSerializer(company).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def portal_login(request):
    """Company portal login with email + password."""
    serializer = CompanyLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        company = Company.objects.get(
            contact_email=serializer.validated_data["email"]
        )
    except Company.DoesNotExist:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not check_password(serializer.validated_data["password"], company.password_hash):
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not company.is_active:
        return Response(
            {"error": "Company account is disabled"},
            status=status.HTTP_403_FORBIDDEN,
        )

    token = _make_portal_token(company)

    return Response({
        "token": token,
        "company": CompanyProfileSerializer(company).data,
    })


@api_view(["GET", "PATCH"])
@authentication_classes([])
@permission_classes([AllowAny])
def portal_profile(request):
    """Get or update company profile (portal-authenticated)."""
    company = PortalAuthentication.get_company(request)
    if not company:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if request.method == "GET":
        return Response(CompanyProfileSerializer(company).data)

    # PATCH
    serializer = CompanyUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    if "webhook_url" in serializer.validated_data:
        company.webhook_url = serializer.validated_data["webhook_url"]
    if "name" in serializer.validated_data:
        company.name = serializer.validated_data["name"]
    company.save()

    return Response(CompanyProfileSerializer(company).data)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def portal_usage(request):
    """Get usage summary for a company (portal-authenticated)."""
    company = PortalAuthentication.get_company(request)
    if not company:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    logs = APIUsageLog.objects.filter(company=company)
    summary = {
        "total_requests": logs.count(),
        "chat_requests": logs.filter(event_type=APIUsageLog.EventType.CHAT_REQUEST).count(),
        "orders_created": logs.filter(event_type=APIUsageLog.EventType.ORDER_CREATED).count(),
        "webhooks_sent": logs.filter(event_type=APIUsageLog.EventType.WEBHOOK_SENT).count(),
    }

    return Response(summary)


# ─── B2B REST Endpoints (API key authenticated) ──────────────────────────────


class ChatHistoryView(APIView):
    """Get chat history for a company's user."""
    authentication_classes = [CompanyAPIKeyAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        from agent.memory import get_chat_history
        from agent.models import AgentSession
        from users.models import User

        user_id = request.query_params.get("user_id")
        if not user_id:
            return Response(
                {"error": "user_id query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(company=request.company, external_user_id=user_id)
        except User.DoesNotExist:
            return Response({"messages": []})

        session = AgentSession.objects.filter(
            company=request.company, user=user
        ).order_by("-last_active_at").first()

        if not session:
            return Response({"messages": []})

        history = get_chat_history(session)

        APIUsageLog.objects.create(
            company=request.company,
            event_type=APIUsageLog.EventType.CHAT_HISTORY,
            endpoint="/api/v1/chat/history/",
            user_id=user_id,
        )

        return Response({
            "session_id": str(session.id),
            "messages": history,
        })


class UserListCreateView(APIView):
    """List all users or create a new user for a company."""
    authentication_classes = [CompanyAPIKeyAuthentication]
    permission_classes = [AllowAny]

    def get(self, request):
        from users.models import User
        from users.serializers import UserSerializer

        users = User.objects.filter(company=request.company).order_by("-created_at")

        APIUsageLog.objects.create(
            company=request.company,
            event_type=APIUsageLog.EventType.USER_LOOKUP,
            endpoint="/api/v1/users/",
        )

        return Response({
            "count": users.count(),
            "results": UserSerializer(users[:100], many=True).data,
        })

    def post(self, request):
        from users.models import User
        from users.serializers import UserSerializer

        external_user_id = request.data.get("external_user_id")
        display_name = request.data.get("display_name", "")

        if not external_user_id:
            return Response(
                {"error": "external_user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, created = User.objects.get_or_create(
            company=request.company,
            external_user_id=external_user_id,
            defaults={"display_name": display_name},
        )

        if not created and display_name:
            user.display_name = display_name
            user.save(update_fields=["display_name"])

        APIUsageLog.objects.create(
            company=request.company,
            event_type=APIUsageLog.EventType.USER_LOOKUP,
            endpoint="/api/v1/users/",
            user_id=external_user_id,
        )

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class UserDetailView(APIView):
    """Get user info within a company."""
    authentication_classes = [CompanyAPIKeyAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        from users.models import User

        try:
            user = User.objects.get(company=request.company, external_user_id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        APIUsageLog.objects.create(
            company=request.company,
            event_type=APIUsageLog.EventType.USER_LOOKUP,
            endpoint=f"/api/v1/users/{user_id}/",
            user_id=user_id,
        )

        from users.serializers import UserSerializer
        return Response(UserSerializer(user).data)


class UserAddressView(APIView):
    """List or create shipping addresses for a company's user."""
    authentication_classes = [CompanyAPIKeyAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        from users.models import User, ShippingAddress

        try:
            user = User.objects.get(company=request.company, external_user_id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        addresses = ShippingAddress.objects.filter(user=user)
        from users.serializers import ShippingAddressSerializer
        return Response(ShippingAddressSerializer(addresses, many=True).data)

    def post(self, request, user_id):
        from users.models import User, ShippingAddress

        try:
            user = User.objects.get(company=request.company, external_user_id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        from users.serializers import ShippingAddressSerializer
        serializer = ShippingAddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user, is_default=not user.shipping_addresses.exists())

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserOrdersView(APIView):
    """List orders for a company's user."""
    authentication_classes = [CompanyAPIKeyAuthentication]
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        from users.models import User
        from orders.models import Order
        from orders.serializers import OrderSerializer

        try:
            user = User.objects.get(company=request.company, external_user_id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        orders = Order.objects.filter(user=user).select_related(
            "merchant", "variant__product"
        )[:20]

        return Response(OrderSerializer(orders, many=True).data)

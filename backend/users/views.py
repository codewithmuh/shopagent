from django.contrib.auth.hashers import check_password, make_password
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def demo_signup(request):
    """Sign up a demo user with email + password."""
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "").strip()
    display_name = request.data.get("display_name", "").strip()

    if not email or not password:
        return Response(
            {"error": "email and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "A user with this email already exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create(
        email=email,
        display_name=display_name or email.split("@")[0],
        password_hash=make_password(password),
    )

    return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def demo_login(request):
    """Log in a demo user with email + password."""
    import uuid
    from datetime import timedelta
    from django.utils import timezone
    from agent.models import AgentSession

    email = request.data.get("email", "").strip()
    password = request.data.get("password", "").strip()

    if not email or not password:
        return Response(
            {"error": "email and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"error": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.password_hash or not check_password(password, user.password_hash):
        return Response(
            {"error": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Find or create an agent session for this user
    session = AgentSession.objects.filter(
        user=user, expires_at__gt=timezone.now()
    ).first()

    if not session:
        session = AgentSession.objects.create(
            user=user,
            company=user.company,
            session_token=uuid.uuid4().hex,
            messages=[],
            expires_at=timezone.now() + timedelta(days=5),
        )

    return Response({
        "user": UserSerializer(user).data,
        "session_token": session.session_token,
    })

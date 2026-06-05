from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import Company


class CompanyAPIKeyAuthentication(BaseAuthentication):
    """
    Authenticate requests using client_id + secret_key.

    Accepts credentials via:
    1. Headers: X-Client-ID + X-Secret-Key
    2. Authorization header: Bearer <client_id>:<secret_key>
    """

    def authenticate(self, request):
        # Try separate headers first
        client_id = request.META.get("HTTP_X_CLIENT_ID")
        secret_key = request.META.get("HTTP_X_SECRET_KEY")

        if client_id and secret_key:
            return self._authenticate_company(client_id, secret_key, request)

        # Try Authorization header
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer ") and ":" in auth_header[7:]:
            client_id, secret_key = auth_header[7:].split(":", 1)
            return self._authenticate_company(client_id, secret_key, request)

        return None  # Let other authenticators try

    def _authenticate_company(self, client_id, secret_key, request):
        try:
            company = Company.objects.get(client_id=client_id, secret_key=secret_key)
        except Company.DoesNotExist:
            raise AuthenticationFailed("Invalid API credentials")

        if not company.is_active:
            raise AuthenticationFailed("Company account is disabled")

        request.company = company
        return (company, None)

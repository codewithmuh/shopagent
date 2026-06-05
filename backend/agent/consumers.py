"""WebSocket consumer for the AI agent chat."""
import json
import logging
import re
import uuid
from datetime import timedelta

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from django.utils import timezone

from .agent import chat
from .memory import get_or_create_session, get_messages, save_messages, get_chat_history

logger = logging.getLogger(__name__)

# ── Guard constants ────────────────────────────────────────────────────────────
MAX_MESSAGE_LENGTH = 500          # chars per message
RATE_LIMIT_PER_MIN = 20          # max messages per user per minute
RATE_LIMIT_BURST = 3             # max messages in BURST_WINDOW seconds
BURST_WINDOW = 5                 # seconds
MAX_ANON_SESSIONS_PER_IP = 3    # anonymous sessions per IP per hour
MAX_CONNECTIONS_PER_USER = 5    # concurrent WebSocket connections per user_id

# Blocked content patterns — checked BEFORE sending to Claude
_BLOCKED_PATTERNS = [
    # Prompt injection / jailbreak attempts
    r"ignore (all |previous |your )?(instructions|rules|prompt)",
    r"you are now",
    r"pretend (you are|to be)",
    r"act as (a |an )?(different|unrestricted|evil|jailbreak|dan|dev mode)",
    r"(forget|disregard|override) (your |all )?(instructions|guidelines|rules|training)",
    r"(new|updated|real) (system |)prompt",
    r"reveal (your |the )?(system |)prompt",
    r"(dan|do anything now|jailbreak|dev mode|developer mode)",
    r"sudo mode",
    r"as an ai without restrictions",
    # Sexual / explicit content
    r"\b(porn|pornography|xxx|hentai|nude|naked|sex(ual)?|nsfw|erotic|masturbat|orgasm|fetish|dildo|vibrator|adult content)\b",
    r"\b(fuck|shit|pussy|dick|cock|ass(hole)?|bitch|cunt|whore|slut)\b",
    # Violence / threats
    r"\b(kill|murder|bomb|terrorist|shoot|stab|rape|assault|attack)\b.{0,30}\b(people|person|user|you)\b",
    # Hate speech
    r"\b(n[i1]gg[ae]r|k[i1]ke|sp[i1]c|ch[i1]nk|f[a4]gg[o0]t)\b",
    # Data exfiltration
    r"(show|list|give|dump) (me |all |)(users|customers|orders|passwords|credentials|database|api key)",
    r"select .{0,30} from .{0,30}(users|orders|merchants)",
]

_BLOCKED_RE = re.compile("|".join(_BLOCKED_PATTERNS), re.IGNORECASE)

# Off-topic patterns — send a redirect response instead of calling Claude
_OFFTOPIC_PATTERNS = [
    r"\b(write (me |a |an )?(essay|code|poem|story|email|letter|report))\b",
    r"\b(how to (hack|crack|bypass|exploit))\b",
    r"\b(what is (the meaning of life|bitcoin|stock market|weather))\b",
    r"\b(translate (this|the following|it) (to|into|from))\b",
    r"\b(give me (a joke|a recipe|directions to))\b",
    r"\b(who (is|was) (the president|prime minister|ceo of))\b",
    r"\b(math|calculate|solve for|integral|derivative)\b",
]
_OFFTOPIC_RE = re.compile("|".join(_OFFTOPIC_PATTERNS), re.IGNORECASE)

OFF_TOPIC_REPLY = (
    "I'm Leo, your AI shopping assistant! I'm here to help you find products, "
    "check prices, and place orders. Is there something you'd like to shop for today?"
)


def _check_rate_limit(key_prefix: str, identifier: str, limit: int, window: int) -> bool:
    """Returns True if allowed, False if rate limited. Uses Redis via Django cache."""
    cache_key = f"rl:{key_prefix}:{identifier}"
    count = cache.get(cache_key, 0)
    if count >= limit:
        return False
    pipe = cache.get_or_set(cache_key, 0, window)
    cache.incr(cache_key)
    # Set expiry on first message only
    if count == 0:
        cache.expire(cache_key, window)
    return True


def _is_rate_limited(user_key: str) -> tuple[bool, str]:
    """Check both burst and per-minute rate limits. Returns (blocked, reason)."""
    # Burst check: max RATE_LIMIT_BURST messages in BURST_WINDOW seconds
    burst_key = f"burst:{user_key}"
    burst_count = cache.get(burst_key, 0)
    if burst_count >= RATE_LIMIT_BURST:
        return True, f"Slow down! Max {RATE_LIMIT_BURST} messages per {BURST_WINDOW} seconds."
    cache.set(burst_key, burst_count + 1, BURST_WINDOW)

    # Per-minute check
    min_key = f"rpm:{user_key}"
    min_count = cache.get(min_key, 0)
    if min_count >= RATE_LIMIT_PER_MIN:
        return True, f"You've sent too many messages. Please wait a moment before continuing."
    if min_count == 0:
        cache.set(min_key, 1, 60)
    else:
        cache.incr(min_key)

    return False, ""


def _check_content(message: str) -> tuple[bool, str]:
    """Returns (blocked, reason). Checks for inappropriate content."""
    if _BLOCKED_RE.search(message):
        return True, "I'm a shopping assistant and can only help with products and orders. Please keep our conversation appropriate."
    return False, ""


def _is_off_topic(message: str) -> bool:
    """Returns True if message is clearly off-topic for a shopping assistant."""
    return bool(_OFFTOPIC_RE.search(message))


class AgentChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.session = None
        self.company = None
        self.user = None
        self._connection_key = None

        # Check for B2B API key auth via query params
        query_string = self.scope.get("query_string", b"").decode()
        params = dict(p.split("=", 1) for p in query_string.split("&") if "=" in p)

        client_id = params.get("client_id")
        secret_key = params.get("secret_key")
        user_id = params.get("user_id")

        if client_id and secret_key:
            # B2B company authentication
            company = await self._authenticate_company(client_id, secret_key)
            if not company:
                await self.accept()
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Invalid API credentials",
                }))
                await self.close(code=4001)
                return

            self.company = company

            if not user_id:
                await self.accept()
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "user_id query parameter is required",
                }))
                await self.close(code=4002)
                return

            # Check concurrent connections per user
            conn_key = f"conn:{client_id}:{user_id}"
            conn_count = cache.get(conn_key, 0)
            if conn_count >= MAX_CONNECTIONS_PER_USER:
                await self.accept()
                await self.send(text_data=json.dumps({
                    "type": "error",
                    "message": "Too many concurrent connections for this user.",
                }))
                await self.close(code=4003)
                return
            cache.set(conn_key, conn_count + 1, 3600)
            self._connection_key = conn_key

            # Resolve or create user for this company
            self.user = await self._resolve_user(company, user_id, params)

            # Get or create session for this company+user
            self.session = await self._get_company_session(company, self.user)
        else:
            # Legacy session-token auth (for demo frontend)
            # Rate-limit anonymous sessions by IP
            client_ip = self._get_client_ip()
            if client_ip:
                ip_key = f"anon_ip:{client_ip}"
                ip_sessions = cache.get(ip_key, 0)
                if ip_sessions >= MAX_ANON_SESSIONS_PER_IP:
                    await self.accept()
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": "Too many sessions from your IP. Please try again later.",
                    }))
                    await self.close(code=4004)
                    return
                cache.set(ip_key, ip_sessions + 1, 3600)

            session_token = self.scope["url_route"]["kwargs"].get("session_token")
            await self.accept()
            self.session = await database_sync_to_async(get_or_create_session)(
                session_token
            )
            user = await database_sync_to_async(lambda: self.session.user)()
            if user:
                self.user = user

            await self.send(text_data=json.dumps({
                "type": "session",
                "session_token": self.session.session_token,
                "user": self._user_info(user) if user else None,
            }))

            # Send chat history if resuming
            history = await database_sync_to_async(get_chat_history)(self.session)
            if history:
                await self.send(text_data=json.dumps({
                    "type": "history",
                    "messages": history,
                }))

            # Deliver any pending follow-up messages
            if self.user:
                await self._deliver_pending_follow_ups()
            return

        # B2B path: accept and send session info
        await self.accept()
        await self.send(text_data=json.dumps({
            "type": "session",
            "session_token": self.session.session_token,
            "user_id": user_id,
            "company": self.company.name,
        }))

        # Send chat history
        history = await database_sync_to_async(get_chat_history)(self.session)
        if history:
            await self.send(text_data=json.dumps({
                "type": "history",
                "messages": history,
            }))

        # Deliver any pending follow-up messages
        if self.user:
            await self._deliver_pending_follow_ups()

    async def disconnect(self, close_code):
        # Decrement concurrent connection count
        if self._connection_key:
            count = cache.get(self._connection_key, 1)
            if count <= 1:
                cache.delete(self._connection_key)
            else:
                cache.decr(self._connection_key)

    async def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Invalid message format",
            }))
            return

        user_message = data.get("message", "").strip()
        if not user_message:
            return

        # ── Guard 1: Message length cap ───────────────────────────────────────
        if len(user_message) > MAX_MESSAGE_LENGTH:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": f"Message too long. Please keep it under {MAX_MESSAGE_LENGTH} characters.",
            }))
            return

        # ── Guard 2: Rate limiting ────────────────────────────────────────────
        rate_key = (
            f"{self.company.id}:{self.user.external_user_id}"
            if self.company and self.user
            else f"anon:{self.session.session_token if self.session else 'unknown'}"
        )
        limited, limit_msg = _is_rate_limited(rate_key)
        if limited:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": limit_msg,
            }))
            return

        # ── Guard 3: Content moderation ───────────────────────────────────────
        blocked, block_msg = _check_content(user_message)
        if blocked:
            logger.warning("Blocked message from %s: content violation", rate_key)
            await self.send(text_data=json.dumps({
                "type": "message",
                "role": "assistant",
                "content": block_msg,
            }))
            return

        # ── Guard 4: Off-topic redirect ───────────────────────────────────────
        if _is_off_topic(user_message):
            await self.send(text_data=json.dumps({
                "type": "message",
                "role": "assistant",
                "content": OFF_TOPIC_REPLY,
            }))
            return

        # Send typing indicator
        await self.send(text_data=json.dumps({"type": "typing", "status": True}))

        try:
            # Load conversation history
            messages = await database_sync_to_async(get_messages)(self.session)

            # Add user message
            messages.append({"role": "user", "content": user_message})

            # Build session context
            session_context = self._build_session_context()

            # Get agent response
            response_text, updated_messages = await database_sync_to_async(chat)(
                messages, session_context
            )

            # Save updated messages
            await database_sync_to_async(save_messages)(
                self.session, updated_messages
            )

            # Log usage for B2B companies
            if self.company:
                await self._log_usage()

            # Extract product cards from response if present
            products = None
            if "<<<PRODUCTS>>>" in response_text:
                parts = response_text.split("<<<PRODUCTS>>>", 1)
                text_part = parts[0].strip()
                json_part = parts[1].split("<<<END_PRODUCTS>>>", 1)[0].strip()
                try:
                    products = json.loads(json_part)
                    response_text = text_part
                except (json.JSONDecodeError, IndexError):
                    pass

            # Send response
            ws_msg = {
                "type": "message",
                "role": "assistant",
                "content": response_text,
            }
            if products:
                ws_msg["products"] = products
            await self.send(text_data=json.dumps(ws_msg))

        except Exception as e:
            logger.exception("Agent chat error")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": "Something went wrong. Please try again.",
            }))

        finally:
            await self.send(text_data=json.dumps({"type": "typing", "status": False}))

    def _get_client_ip(self) -> str:
        """Extract client IP from ASGI scope headers."""
        headers = dict(self.scope.get("headers", []))
        forwarded_for = headers.get(b"x-forwarded-for", b"").decode()
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        client = self.scope.get("client")
        if client:
            return client[0]
        return ""

    def _build_session_context(self):
        """Build context dict passed to the agent."""
        context = {}
        if self.user:
            context["user_id"] = str(self.user.id)
            context["display_name"] = self.user.display_name or ""
            context["external_user_id"] = self.user.external_user_id or ""
        if self.company:
            context["company_id"] = str(self.company.id)
            context["company_name"] = self.company.name
            context["has_webhook"] = bool(self.company.webhook_url)
        # Check if user has shipping address
        if self.user:
            context["has_shipping_address"] = bool(
                getattr(self, "_user_has_address", False)
            )
        return context

    def _user_info(self, user):
        if not user:
            return None
        return {
            "id": str(user.id),
            "display_name": user.display_name,
            "email": user.email,
            "external_user_id": user.external_user_id,
        }

    @database_sync_to_async
    def _authenticate_company(self, client_id, secret_key):
        from companies.models import Company
        try:
            company = Company.objects.get(
                client_id=client_id, secret_key=secret_key, is_active=True
            )
            return company
        except Company.DoesNotExist:
            return None

    @database_sync_to_async
    def _resolve_user(self, company, external_user_id, params):
        from users.models import User
        user, created = User.objects.get_or_create(
            company=company,
            external_user_id=external_user_id,
            defaults={
                "display_name": params.get("display_name", ""),
                "email": params.get("email", ""),
            },
        )
        self._user_has_address = user.shipping_addresses.exists()
        return user

    @database_sync_to_async
    def _get_company_session(self, company, user):
        from .models import AgentSession
        session = AgentSession.objects.filter(
            company=company,
            user=user,
            expires_at__gt=timezone.now(),
        ).order_by("-last_active_at").first()

        if session:
            session.last_active_at = timezone.now()
            session.save(update_fields=["last_active_at"])
            return session

        return AgentSession.objects.create(
            company=company,
            user=user,
            session_token=uuid.uuid4().hex,
            messages=[],
            expires_at=timezone.now() + timedelta(days=5),
        )

    async def _deliver_pending_follow_ups(self):
        """Check for due follow-up messages and inject them into the chat."""
        follow_ups = await self._get_pending_follow_ups()
        for follow_up in follow_ups:
            msg = follow_up.message()
            await self.send(text_data=json.dumps({
                "type": "message",
                "role": "assistant",
                "content": msg,
                "follow_up": True,
            }))
            await self._mark_follow_up_delivered(follow_up)

    @database_sync_to_async
    def _get_pending_follow_ups(self):
        from orders.models import OrderFollowUp
        from django.utils import timezone
        return list(
            OrderFollowUp.objects.filter(
                order__user=self.user,
                status=OrderFollowUp.Status.PENDING,
                send_after__lte=timezone.now(),
            ).select_related("order__variant__product")
        )

    @database_sync_to_async
    def _mark_follow_up_delivered(self, follow_up):
        from django.utils import timezone
        follow_up.status = follow_up.Status.DELIVERED
        follow_up.delivered_at = timezone.now()
        follow_up.save(update_fields=["status", "delivered_at"])

    @database_sync_to_async
    def _log_usage(self):
        from companies.models import APIUsageLog
        APIUsageLog.objects.create(
            company=self.company,
            event_type=APIUsageLog.EventType.CHAT_REQUEST,
            endpoint="ws/agent/",
            user_id=self.user.external_user_id if self.user else "",
        )

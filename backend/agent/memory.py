"""Conversation memory management for agent sessions."""
import json
import uuid
from datetime import timedelta
from django.utils import timezone
from .models import AgentSession


def get_or_create_session(session_token: str = None) -> AgentSession:
    """Get existing session or create a new one."""
    if session_token:
        try:
            session = AgentSession.objects.get(
                session_token=session_token,
                expires_at__gt=timezone.now(),
            )
            session.last_active_at = timezone.now()
            session.save(update_fields=["last_active_at"])
            return session
        except AgentSession.DoesNotExist:
            pass

    # Create new session
    return AgentSession.objects.create(
        session_token=uuid.uuid4().hex,
        messages=[],
        expires_at=timezone.now() + timedelta(days=5),
    )


def get_messages(session: AgentSession) -> list[dict]:
    """Get conversation messages for Claude API format.

    Ensures valid tool_use/tool_result pairing — Claude requires every
    tool_result to have a corresponding tool_use in the previous message.
    """
    raw = session.messages or []
    messages = raw[-50:]

    # Sanitize: skip leading messages that have broken tool_use/tool_result pairs.
    # A user message with tool_result blocks needs the preceding assistant
    # message to contain the matching tool_use blocks.
    start = 0
    for i, msg in enumerate(messages):
        content = msg.get("content", "")
        if msg.get("role") == "user" and isinstance(content, list):
            # This is a tool_result message — needs preceding assistant tool_use
            if i == 0 or not _has_tool_use(messages[i - 1]):
                start = i + 1
                continue
        break

    messages = messages[start:]

    # Ensure messages start with "user" role (Claude requirement)
    while messages and messages[0].get("role") != "user":
        messages.pop(0)

    return messages


def _has_tool_use(msg: dict) -> bool:
    """Check if a message contains tool_use blocks."""
    content = msg.get("content", "")
    if not isinstance(content, list):
        return False
    return any(
        isinstance(b, dict) and b.get("type") == "tool_use"
        for b in content
    )


def save_messages(session: AgentSession, messages: list[dict]):
    """Save conversation messages to session.

    We need to serialize Anthropic content blocks to JSON-safe dicts.
    """
    serialized = []
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")

        if isinstance(content, list):
            serialized_content = []
            for block in content:
                if hasattr(block, "type"):
                    # Anthropic API object — convert to dict
                    if block.type == "text":
                        serialized_content.append({"type": "text", "text": block.text})
                    elif block.type == "tool_use":
                        serialized_content.append({
                            "type": "tool_use",
                            "id": block.id,
                            "name": block.name,
                            "input": block.input,
                        })
                    elif block.type == "tool_result":
                        serialized_content.append({
                            "type": "tool_result",
                            "tool_use_id": block.get("tool_use_id", ""),
                            "content": block.get("content", ""),
                        })
                elif isinstance(block, dict):
                    serialized_content.append(block)
            serialized.append({"role": role, "content": serialized_content})
        else:
            serialized.append({"role": role, "content": content})

    session.messages = serialized
    session.last_active_at = timezone.now()
    session.save(update_fields=["messages", "last_active_at"])


def get_chat_history(session: AgentSession) -> list[dict]:
    """Extract user/assistant text messages for frontend display.

    Also reconstructs product card data from tool results so that
    product cards can be shown when restoring chat history.
    """
    raw = session.messages or []
    history = []
    PRODUCT_TOOLS = {"search_products", "get_product_details"}

    # Track pending product data from tool results
    pending_products = []

    for msg in raw:
        role = msg.get("role", "")
        content = msg.get("content", "")

        if role == "user" and isinstance(content, str):
            history.append({"role": "user", "content": content})
        elif role == "user" and isinstance(content, list):
            # Tool result messages — extract product data
            for block in content:
                if isinstance(block, dict) and block.get("type") == "tool_result":
                    result_content = block.get("content", "")
                    if isinstance(result_content, str):
                        try:
                            json_str = result_content
                            if "\n\n" in result_content:
                                json_str = result_content.split("\n\n", 1)[1]
                            parsed = json.loads(json_str)
                            if isinstance(parsed, list):
                                pending_products.extend(parsed)
                            elif isinstance(parsed, dict) and "variants" in parsed:
                                pending_products.append(parsed)
                        except (json.JSONDecodeError, IndexError):
                            pass
        elif role == "assistant":
            # Extract text from content blocks
            text_parts = []
            has_tool_use = False
            if isinstance(content, str):
                text_parts.append(content)
            elif isinstance(content, list):
                for block in content:
                    if isinstance(block, dict):
                        if block.get("type") == "text":
                            text_parts.append(block["text"])
                        elif block.get("type") == "tool_use":
                            has_tool_use = True

            # If this assistant message has tool_use, skip it (intermediate)
            if has_tool_use:
                continue

            if text_parts:
                from .agent import _strip_product_listings
                text = "\n".join(text_parts)
                entry = {"role": "assistant", "content": text}
                if pending_products:
                    entry["content"] = _strip_product_listings(text)
                    entry["products"] = pending_products
                    pending_products = []
                history.append(entry)

    return history



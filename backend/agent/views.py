"""TTS endpoint using OpenAI Text-to-Speech API with streaming."""
import json
import logging

from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)

_openai_client = None


def get_openai_client():
    global _openai_client
    if _openai_client is None:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


@csrf_exempt
@require_POST
def text_to_speech(request):
    """Convert text to speech using OpenAI TTS API with streaming.

    POST /api/agent/tts/
    Body: {"text": "Hello world", "voice": "nova"}
    Returns: streaming audio/mpeg binary
    """
    try:
        body = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    text = body.get("text", "").strip()
    if not text:
        return JsonResponse({"error": "Text is required"}, status=400)

    if len(text) > 4096:
        text = text[:4096]

    voice = body.get("voice", "nova")
    if voice not in ("alloy", "echo", "fable", "onyx", "nova", "shimmer"):
        voice = "nova"

    if not settings.OPENAI_API_KEY:
        return JsonResponse({"error": "OpenAI API key not configured"}, status=503)

    try:
        client = get_openai_client()

        # Use streaming — audio starts playing before full generation completes
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            response_format="mp3",
        )

        def stream_audio():
            for chunk in response.iter_bytes(chunk_size=4096):
                yield chunk

        return StreamingHttpResponse(
            stream_audio(),
            content_type="audio/mpeg",
            headers={
                "Cache-Control": "public, max-age=3600",
            },
        )

    except Exception:
        logger.exception("TTS generation failed")
        return JsonResponse({"error": "Failed to generate speech"}, status=500)

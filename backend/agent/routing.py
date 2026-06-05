from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/agent/(?P<session_token>\w+)/$", consumers.AgentChatConsumer.as_asgi()),
    re_path(r"ws/agent/$", consumers.AgentChatConsumer.as_asgi()),
]

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export type WSMessage =
  | { type: "session"; session_token: string; user: { user_id: string; display_name: string; email?: string } | null; user_id?: string; company?: string }
  | { type: "message"; role: string; content: string; products?: unknown[]; user_id?: string; company?: string }
  | { type: "history"; messages: { role: string; content: string; products?: unknown[]; user_id?: string }[] }
  | { type: "typing"; status: boolean }
  | { type: "error"; message: string };

export class AgentWebSocket {
  private ws: WebSocket | null = null;
  private sessionToken: string | null = null;
  private onMessage: (msg: WSMessage) => void;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  constructor(onMessage: (msg: WSMessage) => void) {
    this.onMessage = onMessage;
  }

  connect(sessionToken?: string) {
    // Clean up any existing connection first
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.intentionalClose = true;
      this.ws.close();
      this.ws = null;
    }

    this.intentionalClose = false;
    this.sessionToken = sessionToken || null;
    const path = sessionToken
      ? `${WS_URL}/ws/agent/${sessionToken}/`
      : `${WS_URL}/ws/agent/`;

    this.ws = new WebSocket(path);

    this.ws.onopen = () => {
      console.log("Agent WebSocket connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;
        if (data.type === "session") {
          this.sessionToken = data.session_token;
          if (typeof window !== "undefined") {
            localStorage.setItem("agent_session", data.session_token);
          }
        }
        this.onMessage(data);
      } catch {
        console.error("Failed to parse WS message");
      }
    };

    this.ws.onclose = () => {
      if (this.intentionalClose) return;
      console.log("Agent WebSocket disconnected, reconnecting in 3s...");
      this.reconnectTimer = setTimeout(() => this.connect(this.sessionToken || undefined), 3000);
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }

  send(message: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ message }));
    }
  }

  disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  connectWithApiKeys(params: {
    clientId: string;
    secretKey: string;
    userId: string;
    displayName?: string;
  }) {
    // Clean up any existing connection first
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.intentionalClose = true;
      this.ws.close();
      this.ws = null;
    }

    this.intentionalClose = false;
    this.sessionToken = null;

    const queryParts = [
      `client_id=${encodeURIComponent(params.clientId)}`,
      `secret_key=${encodeURIComponent(params.secretKey)}`,
      `user_id=${encodeURIComponent(params.userId)}`,
    ];
    if (params.displayName) {
      queryParts.push(`display_name=${encodeURIComponent(params.displayName)}`);
    }
    const path = `${WS_URL}/ws/agent/?${queryParts.join("&")}`;

    this.ws = new WebSocket(path);

    this.ws.onopen = () => {
      console.log("Agent WebSocket connected (API key mode)");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;
        if (data.type === "session") {
          this.sessionToken = data.session_token;
        }
        this.onMessage(data);
      } catch {
        console.error("Failed to parse WS message");
      }
    };

    this.ws.onclose = () => {
      if (this.intentionalClose) return;
      console.log("Agent WebSocket disconnected, reconnecting in 3s...");
      this.reconnectTimer = setTimeout(() => this.connectWithApiKeys(params), 3000);
    };

    this.ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }

  getSessionToken() {
    return this.sessionToken;
  }
}

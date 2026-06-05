#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# ShopAgent — Production Deployment Script
# Run: chmod +x deploy.sh && sudo ./deploy.sh
#
# Prerequisites:
#   1. Ubuntu EC2 with Nginx installed
#   2. DNS A records pointing to this server:
#      - app.example.com
#      - api.example.com
#   3. Repo cloned to current directory
# ─────────────────────────────────────────────────────────────

FRONTEND_DOMAIN="app.example.com"
BACKEND_DOMAIN="api.example.com"
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "================================================"
echo "  ShopAgent — Production Deployment"
echo "================================================"
echo ""
echo "  Frontend: ${FRONTEND_DOMAIN}"
echo "  Backend:  ${BACKEND_DOMAIN}"
echo "  App dir:  ${APP_DIR}"
echo ""

# ── 1. Collect secrets ─────────────────────────────────────
echo "[1/7] Collecting configuration..."

if [ -f "${APP_DIR}/.env" ] && grep -q "ANTHROPIC_API_KEY=sk-ant" "${APP_DIR}/.env"; then
    echo "  Found existing .env with API key, reusing it."
    # shellcheck disable=SC1091
    source <(grep -E '^(ANTHROPIC_API_KEY|OPENAI_API_KEY)=' "${APP_DIR}/.env")
else
    read -rp "  Enter your Anthropic API key: " ANTHROPIC_API_KEY
    read -rp "  Enter your OpenAI API key (for TTS, or press Enter to skip): " OPENAI_API_KEY
fi

DJANGO_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(50))" 2>/dev/null || openssl rand -base64 50)
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)

# ── 2. Install Docker ──────────────────────────────────────
echo ""
echo "[2/7] Installing Docker..."

if command -v docker &>/dev/null; then
    echo "  Docker already installed: $(docker --version)"
else
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "  Docker installed: $(docker --version)"
fi

# ── 3. Install Certbot ─────────────────────────────────────
echo ""
echo "[3/7] Installing Certbot..."

if command -v certbot &>/dev/null; then
    echo "  Certbot already installed."
else
    apt-get install -y -qq certbot python3-certbot-nginx
    echo "  Certbot installed."
fi

# ── 4. Create production .env ──────────────────────────────
echo ""
echo "[4/7] Creating production .env..."

cat > "${APP_DIR}/.env" <<EOF
# Django
DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${BACKEND_DOMAIN},localhost,127.0.0.1

# Database
DB_NAME=ai_stores
DB_USER=postgres
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# CORS
CORS_ALLOWED_ORIGINS=https://${FRONTEND_DOMAIN}

# Anthropic
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# OpenAI (for TTS voice responses)
OPENAI_API_KEY=${OPENAI_API_KEY:-}

# Next.js (public — baked into frontend build)
NEXT_PUBLIC_API_URL=https://${BACKEND_DOMAIN}
NEXT_PUBLIC_WS_URL=wss://${BACKEND_DOMAIN}
EOF

# Also update docker-compose postgres password to match
sed -i "s/POSTGRES_PASSWORD: postgres/POSTGRES_PASSWORD: ${DB_PASSWORD}/" "${APP_DIR}/docker-compose.yml"

echo "  .env created."

# ── 5. Configure Nginx (HTTP first for Certbot) ───────────
echo ""
echo "[5/7] Configuring Nginx..."

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Backend config
cat > /etc/nginx/sites-available/${BACKEND_DOMAIN} <<'NGINX'
server {
    listen 80;
    server_name BACKEND_DOMAIN_PLACEHOLDER;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
NGINX
sed -i "s/BACKEND_DOMAIN_PLACEHOLDER/${BACKEND_DOMAIN}/g" /etc/nginx/sites-available/${BACKEND_DOMAIN}

# Frontend config
cat > /etc/nginx/sites-available/${FRONTEND_DOMAIN} <<'NGINX'
server {
    listen 80;
    server_name FRONTEND_DOMAIN_PLACEHOLDER;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
sed -i "s/FRONTEND_DOMAIN_PLACEHOLDER/${FRONTEND_DOMAIN}/g" /etc/nginx/sites-available/${FRONTEND_DOMAIN}

# Enable sites
ln -sf /etc/nginx/sites-available/${BACKEND_DOMAIN} /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/${FRONTEND_DOMAIN} /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx
echo "  Nginx configured (HTTP)."

# ── 6. SSL with Let's Encrypt ──────────────────────────────
echo ""
echo "[6/7] Setting up SSL certificates..."

read -rp "  Enter your email for Let's Encrypt (or press Enter for no email): " CERT_EMAIL
EMAIL_FLAG=""
if [ -n "${CERT_EMAIL}" ]; then
    EMAIL_FLAG="--email ${CERT_EMAIL}"
else
    EMAIL_FLAG="--register-unsafely-without-email"
fi

certbot --nginx \
    -d ${BACKEND_DOMAIN} \
    -d ${FRONTEND_DOMAIN} \
    ${EMAIL_FLAG} \
    --agree-tos \
    --non-interactive \
    --redirect

echo "  SSL certificates installed."

# ── 7. Build and start containers ──────────────────────────
echo ""
echo "[7/7] Building and starting Docker containers..."

cd "${APP_DIR}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo ""
echo "  Waiting for services to start..."
sleep 10

# Check if containers are running
if docker compose ps | grep -q "running"; then
    echo "  All containers are running."
else
    echo "  WARNING: Some containers may not be running. Check with:"
    echo "    docker compose -f docker-compose.yml -f docker-compose.prod.yml logs"
fi

# ── Done ───────────────────────────────────────────────────
echo ""
echo "================================================"
echo "  Deployment Complete!"
echo "================================================"
echo ""
echo "  Frontend:  https://${FRONTEND_DOMAIN}"
echo "  Backend:   https://${BACKEND_DOMAIN}"
echo "  API test:  https://${BACKEND_DOMAIN}/api/catalog/search/"
echo ""
echo "  Useful commands:"
echo "    docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
echo "    docker compose -f docker-compose.yml -f docker-compose.prod.yml restart"
echo "    docker compose -f docker-compose.yml -f docker-compose.prod.yml down"
echo ""
echo "  Merchant logins (password: demo1234):"
echo "    store@urbanstyle.com"
echo "    hello@techgadgets.io"
echo "    shop@greenleaf.co"
echo "    info@luxwatches.com"
echo "    support@fitgear.store"
echo ""

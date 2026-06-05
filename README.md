# 🛍️ ShopAgent

**An end-to-end, multi-tenant AI shopping assistant platform.** Shoppers chat (text **and**
voice) with an AI agent named **Leo** to discover products and place orders; merchants
connect their **Shopify** store and products sync in; companies embed the agent in their
own app via an API + payment webhooks.

Built as a complete, runnable build-along on the [**@codewithmuh**](https://youtube.com/@codewithmuh)
YouTube channel — runs locally end-to-end with one command.

> **License:** source-available under **PolyForm Noncommercial 1.0.0** — learn freely,
> commercial use needs permission. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

---

## What's inside

ShopAgent serves **three kinds of users**:

| User | What they do | Where |
|------|--------------|-------|
| 🛒 **Shoppers** | Chat (text + voice) with **Leo** to discover products, get recommendations, place & track orders | `/demo/*` |
| 🏪 **Merchants** | Connect a Shopify store, sync products, view orders & inventory | `/merchant/*` |
| 🏢 **Companies** | Embed the agent in their own app via `client_id`/`secret_key` + payment webhooks | `/portal/*` |

The agent is a **Claude tool-use loop** with real guardrails: prompt-injection resistance,
strict shopping-only scope, content filtering, rate limiting, and per-session order caps.

---

## ✨ Features

- **Conversational commerce** — natural-language product search, recommendations, address
  capture, order placement and tracking, all through chat.
- **Voice mode** — optional speech in/out (OpenAI TTS) for a hands-free shopping demo.
- **Real Shopify sync** — merchants paste an Admin API token; products, variants, prices,
  images, and live inventory sync in. Stock is decremented back in Shopify on each order.
- **Multi-currency** — merchant prices are normalized to a single display currency
  (`DEFAULT_CURRENCY`, default `USD`) across 11 supported currencies.
- **Company API + webhooks** — embed the agent over WebSocket with `client_id`/`secret_key`;
  `balance_check` / `charge` payment webhooks let the host app authorize and settle payment.
- **Safety guards** — prompt-injection / jailbreak resistance, off-topic deflection, abuse &
  content filters, Redis-backed rate limits, max-orders-per-session.
- **One-command local dev** — `make up` boots Postgres, Redis, Django/Daphne, and Next.js,
  auto-migrates, and seeds demo data.

---

## 🧱 Tech stack

**Backend** — Django 5.2 · Django REST Framework · Channels + Daphne (ASGI/WebSocket) ·
PostgreSQL · Redis · Anthropic Claude (tool use) · JWT auth · boto3 (S3) · Python 3.10

**Frontend** — Next.js 16 · React 19 · Tailwind CSS 4 · TypeScript · Node 22

**Infra (optional)** — Terraform for AWS ECS Fargate + RDS + ElastiCache + ALB + ECR + Route53

---

## 🚀 Quickstart (≈60 seconds)

**Prerequisites:** Docker (with the Compose v2 plugin) and an
[Anthropic API key](https://console.anthropic.com/).

```bash
# 1. Configure
cp .env.example .env
#    → open .env and set ANTHROPIC_API_KEY=sk-ant-...

# 2. Run everything (builds images, migrates, seeds demo data)
make up
```

Then open:

| Surface | URL |
|---------|-----|
| 🛒 Shopper demo (chat with Leo) | http://localhost:3000/demo/login |
| 🏪 Merchant portal | http://localhost:3000/merchant/login |
| 🏢 Company portal | http://localhost:3000/portal/login |
| 🧪 API playground | http://localhost:3000/playground |
| ⚙️ Django admin / API | http://localhost:8000 |

### Demo logins (all seeded, password `demo1234`)

| Role | Email |
|------|-------|
| Shopper (demo) | `demo@acme.com` |
| Company portal (Acme) | `demo@acme.com` |
| Merchant | `store@urbanstyle.com` · `hello@techgadgets.io` · `shop@greenleaf.co` · `info@luxwatches.com` · `support@fitgear.store` |

Seed data: **5 merchants, 15 products (28 variants)**, 1 demo API-consumer company (Acme), and demo shoppers.

> **Try it:** open the shopper demo, say *"hi"*, then *"show me some headphones"* — Leo
> searches the catalog and renders product cards. Add an address and place an order.

---

## 🛒 Connect a real Shopify store

Get **real product data** on camera for free using a Shopify Partners development store —
no paid plan required. Full walkthrough: **[docs/SHOPIFY_SETUP.md](docs/SHOPIFY_SETUP.md)**.

TL;DR: free Partners account → dev store → custom app → Admin API token → paste it in the
Merchant Portal **Connections** page → products sync → Leo recommends them in chat.

---

## 🧰 Make targets

```text
make up            # build + start everything (auto-migrate + seed)
make up-d          # same, detached (background)
make down          # stop (keeps the database volume)
make reset         # wipe everything incl. DB volume, rebuild from scratch
make seed          # (re)seed demo merchants, products, company, users
make shopify-sync  # re-sync all connected Shopify stores
make migrate       # apply database migrations
make superuser     # create a Django admin superuser
make logs          # tail all logs
make shell         # shell into the backend container
```

Run `make` with no target for the full menu.

---

## 🗂️ Project structure

```
shopagent/
├── backend/                 # Django + DRF + Channels
│   ├── agent/               # Claude loop, system prompt, tools, WebSocket consumer, guards
│   ├── merchants/           # Merchant accounts + Shopify connections
│   ├── companies/           # API-consumer companies (client_id/secret_key), usage logs
│   ├── products/  orders/  users/
│   ├── integrations/        # shopify.py, s3.py, webhooks.py
│   ├── seed/                # demo data seeder
│   └── config/              # settings, ASGI/WSGI, URLs
├── frontend/                # Next.js 16 app (shopper / merchant / company surfaces)
├── infra/                   # Terraform for AWS (optional — see infra/README.md)
├── docs/SHOPIFY_SETUP.md    # connect a real Shopify dev store
├── DEPLOYMENT.md            # production deployment guide (sanitized placeholders)
├── docker-compose.yml       # base stack
├── docker-compose.override.yml  # local dev (hot reload, auto-seed) — auto-loaded
├── docker-compose.prod.yml  # production overrides
└── Makefile
```

---

## ⚙️ Configuration

All configuration is via environment variables — see **[.env.example](.env.example)** for the
documented list. Highlights:

- `ANTHROPIC_API_KEY` — **required**, powers Leo.
- `DEFAULT_CURRENCY` — display currency (default `USD`).
- `OPENAI_API_KEY` — *optional*, enables voice mode (TTS).
- `AWS_*` — *optional*, re-host synced product images on S3 (falls back to Shopify CDN URLs).
- `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` — backend URLs baked into the frontend.

---

## 🏛️ Architecture

A Next.js frontend talks to a Django/DRF API over HTTP and to the Claude-powered agent over a
**WebSocket** (Channels + Daphne, with Redis as the channel layer). The agent runs a tool-use
loop against the product/order/address tools, and merchant catalogs are populated by the
Shopify Admin API sync.

A rendered AWS production topology is in
[`infra/architecture-diagram.html`](infra/architecture-diagram.html) (open in a browser), with
the editable source in [`architecture-diagram.excalidraw`](architecture-diagram.excalidraw).

<!--
  Screenshots to capture for the README / video thumbnail (Phase 5 filming checklist):
  docs/screenshots/  → shopper-chat.png, product-cards.png, voice-mode.png,
                       merchant-connections.png, company-portal.png
-->

---

## ☁️ Deployment

Local dev needs only Docker. For a real AWS deployment (ECS Fargate + RDS + ElastiCache + ALB),
see **[DEPLOYMENT.md](DEPLOYMENT.md)** and the Terraform in **[infra/](infra/README.md)**. All
account-specific values in those docs are placeholders (`<AWS_ACCOUNT_ID>`, `<EC2_HOST>`, …) —
fill in your own.

---

## 🔒 Security notes (read before shipping)

This is a teaching codebase. A few things are intentionally simplified and **must be hardened
before any real commercial deployment**:

- Merchant Shopify access tokens are stored **in plaintext** (`MerchantConnection`,
  marked `TODO: encrypt in production`) so the data flow is easy to follow on camera. Encrypt
  them at rest in production (e.g. KMS / Fernet).
- Demo credentials and secrets in `.env.example` are for local use only — generate real,
  unique secrets for production.

The agent itself ships with solid guardrails (prompt-injection resistance, scope/content
filters, rate limiting) — see `backend/agent/`.

---

## 📺 About

Built by **CodeWithMuh** as a practical, build-it-with-Claude-Code tutorial. If this helped
you, subscribe: [youtube.com/@codewithmuh](https://youtube.com/@codewithmuh).

## 📄 License

**PolyForm Noncommercial License 1.0.0** — source-available. Learn, fork, and build
noncommercially for free; **commercial use requires permission**. See [LICENSE](LICENSE) and
[NOTICE](NOTICE). Commercial licensing inquiries: **codewithmuh@gmail.com**.

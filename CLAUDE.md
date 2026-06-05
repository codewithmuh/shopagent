# ShopAgent — Project Context & Handoff

> **This file is the full handoff from the planning session.** It is the "chat history in one file."
> Read it top-to-bottom to resume work. When a new Claude Code session starts in this folder,
> this file auto-loads — so you already have all the context below.

---

## 0. TL;DR — what we're doing

I (Muhammad / CodeWithMuh) built a **multi-tenant AI shopping assistant platform** for a client in
March 2026. It was a private repo called **`ai-stores`**, internally branded **"Fauri"**, deployed on
AWS for a Pakistani perfume retailer.

We are **rebranding it to `ShopAgent`**, genericizing all client/AWS details, making it run **locally
with Docker Compose** for a **YouTube tutorial** ("how to build an AI shopping agent end-to-end"), and
publishing it as a **source-available** repo (learn freely; commercial use needs my permission).

**This folder (`/Users/rashid/shopagent/`) is the NEW project.** It was copied from the original clone
(`/Users/rashid/codwithmuh-assitant/ai-stores/`, kept untouched as reference) **without git history**,
and the standalone secret files were already deleted (see §3).

---

## 1. The original request (verbatim intent)

- Clone my private repo `https://github.com/codewithmuh/ai-stores.git` (done — reference copy at
  `/Users/rashid/codwithmuh-assitant/ai-stores/`).
- It's a system I built ~3 months ago (March 2026) for a client. Works fine in production.
- **Rebrand it** into a folder with a unique name → we chose **`ShopAgent`**.
- Do **all** the rebranding + whatever **improvements** make sense.
- Make it a **complete end-to-end solution** suitable for a **YouTube build-along video**.
- Publish the new repo **public but licensed** — NOT MIT. People can **learn**, but **commercial use
  requires my permission** → we chose **PolyForm Noncommercial 1.0.0**.
- I have **no Shopify account** → need a way to get **test product data** on camera → we chose a free
  **Shopify Partners development store**.
- Must run **end-to-end locally via Docker Compose** for a full live demo.

---

## 2. Decisions already locked (do not re-ask)

| Decision | Choice |
|----------|--------|
| **New name** | **ShopAgent** (folder `shopagent/`, infra `shopagent-*`, API key prefix `shopagent_test_…`) |
| **License** | **PolyForm Noncommercial 1.0.0** + short `NOTICE` ("learn freely; commercial use → email me") |
| **Git history** | **Fresh repo, zero history** — never import the old `.git` (it contains a leaked AWS key) |
| **Demo data** | **Shopify Partners dev store** (free) for the live "connect a real store" moment |
| **In-chat assistant name** | Default to **"Aria"** (was "Fauri") unless I say otherwise — confirm with me |
| **Default currency** | Change hardcoded **PKR → USD** via a `DEFAULT_CURRENCY` env var |

---

## 3. 🚨 SECURITY — leaked secrets (CRITICAL)

The original repo committed real secrets **into git history**. That's why the new repo starts fresh.

**Action still needed from ME (Muhammad), outside this repo:**
- [ ] **Delete/rotate the AWS access key `AKIA…DFDK`** in the AWS IAM console — it was on GitHub.

**Already handled in this folder:**
- [x] Copied working tree **without `.git`** (no leaked history travels here).
- [x] Deleted `a.txt` (two API keys/hashes), `notes.txt` (live portal login + client brand names),
      the client screenshot PNG, and `infra/fauri-architecture.png`.

**Sanitized in Phase 1 (2026-06-05) — placeholders now, no real values:**
- [x] `DEPLOYMENT.md` — account id→`<AWS_ACCOUNT_ID>`, key→`<YOUR_AWS_ACCESS_KEY_ID>`, EC2 host/IP→`<EC2_HOST>`/`<EC2_IP>`, ALB→`<ALB_DNS_NAME>`, target-group ARN→placeholders, region→`us-east-1`
- [x] `deploy.sh` — `store.codewithmuh.com`→`app.example.com`, hostnames→`*.example.com`
- [x] `.github/workflows/deploy.yml` — ECR/cluster/service names→`shopagent-*`, domains→`api.example.com`
> ⚠️ One leftover: this **`CLAUDE.md`** is the internal planning handoff and still references the (truncated) leaked key `AKIA…DFDK` for the rotation reminder below. Exclude `CLAUDE.md` from the public repo (add to `.gitignore`) or sanitize it before publishing.

---

## 4. What the system actually is (architecture)

A **multi-tenant AI shopping assistant platform** with three user types:

1. **Shoppers** — chat (text + voice) with an AI agent to discover products and place/track orders.
2. **Merchants** — connect their **Shopify** store; products sync in. Portal: login, dashboard,
   products, connections, orders.
3. **Companies (API consumers)** — embed the agent into their own app via `client_id`/`secret_key` +
   payment webhooks. (Original client embedded it in a crypto-wallet app — hence "wallet" mentions.)

### Stack
- **Backend** — Django 5.2 + DRF + **Channels/Daphne** (WebSocket chat), **Postgres** + **Redis**,
  **Anthropic Claude** agent with tool-use, JWT auth. Strong prompt-injection / abuse / content guards.
- **Frontend** — **Next.js 16** + React 19 + Tailwind 4. Surfaces: shopper demo (`/demo/*`),
  merchant portal (`/merchant/*`), company portal (`/portal/*`), docs/legal pages.
- **Integrations** — Shopify Admin REST API (product sync), S3 (images), payment webhooks,
  EventBridge cron (post-order delivery follow-ups).
- **Infra** — full **Terraform** for AWS **ECS Fargate + RDS + ElastiCache + ALB + ECR + Route53**.

### Key backend modules (`backend/`)
- `agent/` — `agent.py` (Claude loop + system prompt, persona "Fauri"→rename), `tools.py` (tool defs +
  **hardcoded `TARGET_CURRENCY="PKR"`** → make env-driven), `consumers.py` (WebSocket + guards),
  `memory.py` (session history).
- `merchants/` — Merchant model + `MerchantConnection` (Shopify shop_domain + access token,
  **stored plaintext — `TODO: decrypt in production`**, keep as a teaching note in README).
- `companies/` — API-consumer model (`client_id`/`secret_key` prefix `fauri_`→`shopagent_`), usage logs.
- `products/`, `orders/`, `users/`, `integrations/` (`shopify.py`, `s3.py`, `webhooks.py`).
- `seed/management/commands/seed.py` — 5 mock merchants + ~20 products (mock data, picsum images).

### Branding surface to change
- **256 "Fauri" occurrences across 34 files** (UI, system prompt, page metadata).
- Domains `api.fauri.ai` / `fauri.ai` → env-driven + `example.com` in docs.
- Infra names `fauri-cluster`, `fauri-vpc`, `fauri/backend` (ECR), `fauri/prod/credentials`, log groups.

---

## 5. The plan (phased)

### Phase 0 — Safety & fresh folder  ✅ DONE (this session)
- [x] New folder `/Users/rashid/shopagent/`, working tree only (no `.git`).
- [x] Deleted standalone secret files (a.txt, notes.txt, client PNGs).
- [ ] (Me, in AWS console) rotate the leaked AWS key.

### Phase 1 — Rebrand & de-client  ✅ DONE (2026-06-05)
- [x] Replaced all brand "Fauri" → "ShopAgent" (UI, metadata, marketing, legal, infra, docs).
- [x] In-chat assistant persona "Fauri" → **"Leo"** (system prompt, greetings, chat widget/voice labels).
- [x] Domains → `example.com`/`api.example.com` in docs; runtime still uses `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_WS_URL`.
- [x] Infra names `fauri-*` → `shopagent-*`; ECR paths; `client_id` prefix `fauri_`→`shopagent_`; region `ap-south-1`→`us-east-1`.
- [x] Genericized currency: `TARGET_CURRENCY="PKR"` → `DEFAULT_CURRENCY` env (default `USD`), base-USD rate table; removed perfume/Pakistan examples from the system prompt. (PK/PKR kept as ONE of 11 supported currencies — generic, not client-specific.)
- [x] **De-client:** demo company "KAYS/Kays" → **"Acme"**; identifiers unified (`client_id` `shopagent_test_demo`, user `demo@acme.com`) consistently across seed + demo pages + playground; webhook paths/secrets → `webhooks/shopagent` / `SHOPAGENT_WEBHOOK_SECRET`.
- [x] **Sanitized `DEPLOYMENT.md` + `deploy.sh` + workflow** (see §3).
- [x] **DECIDED (2026-06-05): KEEP the crypto-wallet payment story.** Landing page ("Pay with Crypto", "Connect your wallet", USDC) and the `balance_check`/`charge` webhook model with `token_address`/`network` stay as-is — it's the documented payment integration for API-consumer companies. No change needed.

### Phase 2 — One-command local dev (Docker Compose)  ✅ DONE (2026-06-05)
- [x] `docker-compose.override.yml` (auto-loaded in dev): frontend `next dev` (Turbopack hot reload) + bind mount; backend ASGI `runserver` (auto-reload + WebSockets, since `daphne`+`channels`). Prod is unaffected (uses explicit `-f docker-compose.yml -f docker-compose.prod.yml`, which skips the override).
- [x] Auto-run `migrate` + `seed` on `up` (idempotent `get_or_create` seed, in the dev override's backend command — NOT in prod).
- [x] `Makefile`: `up`, `up-d`, `down`, `reset`, `seed`, `shopify-sync` (→ `backfill_shopify`), `migrate`, `superuser`, `logs`, `shell`, `ps`, `build`, `help` (default).
- [x] Rewrote `.env.example` — documented sections; **Anthropic required**, OpenAI(voice)/AWS-S3(images) optional with graceful fallback, `DEFAULT_CURRENCY`, demo-company overrides. Shopify needs NO global key (per-merchant token via portal).
- Notes: ASGI-aware `runserver` confirmed (daphne is first in INSTALLED_APPS). S3 upload is gated on `AWS_ACCESS_KEY_ID`, so sync falls back to Shopify CDN URLs without AWS — demo runs with zero cloud creds. A local `.env` was created from the template (gitignored) — **add your real `ANTHROPIC_API_KEY` before `make up`**. Compose merge + Makefile validated; full `make up` boot deferred to Phase 5.

### Phase 3 — Shopify Partners dev-store guide  ✅ DONE (2026-06-05)
- [x] `docs/SHOPIFY_SETUP.md`: free Partners account → dev store (start with test data) →
      custom app → Admin API scopes (`read_products` required; `read_inventory`/`write_inventory`/`read_locations` for stock write-back) → reveal `shpat_…` token → Merchant Portal `/merchant/login` (seeded merchants, pw `demo1234`) → Connections → **Connect Store** (auto-syncs) → verify in Products + `/demo/chat`. Includes "how sync works" (Admin REST `2024-01`, currency normalization, S3-optional images, stock write-back), a troubleshooting table, and the plaintext-token teaching note. `make shopify-sync` re-syncs.
- Note: guide forward-references `README.md` (Phase 4, not yet created).

### Phase 4 — Open-source polish  ✅ DONE (2026-06-05)
- [x] `README.md` — what it is (3 user types), features, tech stack (Django 5.2/Channels, Next 16/React 19/Tailwind 4), 60-sec quickstart, demo-login tables (pw `demo1234`), surface URLs, make targets, project structure, config, architecture, deployment, security notes, PolyForm license section, CodeWithMuh credit. (Screenshots left as an HTML-comment capture-list for Phase 5.)
- [x] `LICENSE` = **PolyForm Noncommercial 1.0.0** (full canonical text + `Required Notice:` line).
- [x] `NOTICE` — source-available explainer ("learn freely; commercial use → email codewithmuh@gmail.com").
- [x] `infra/README.md` — generic Terraform overview, marked optional (local uses Docker), tfvars/apply flow, diagram regen.

### Phase 5 — End-to-end verification (Claude runs it)
- [ ] `make up` → migrate → seed → open `localhost:3000` → shopper chat → place order →
      merchant portal → connect Shopify dev store → sync → confirm synced products in chat.
- [ ] Produce a **filming checklist**.

### Phase 6 — YouTube (later)
- [ ] Hook + arc + script via the `/youtube-plan` skill once the build is verified.

---

## 6. Current status / where to resume

- **Done:** Phase 0 + **Phase 1** (rebrand, de-client, currency, sanitize) + **Phase 2** (Docker Compose dev) + **Phase 3** (`docs/SHOPIFY_SETUP.md`) + **Phase 4** (README, LICENSE, NOTICE, infra/README).
- **Locked names:** brand **ShopAgent**, assistant persona **Leo**, demo company **Acme**. Crypto-wallet payment story: **KEEP** (decided).
- **Branding + docs legibility DONE (2026-06-05):**
  - **Logo letters fixed** (rebrand leftovers): platform avatars were **"F"** (Fauri) and portal/merchant were **"K"** (Kays!) — now **S**=ShopAgent (landing/docs/legal/contact/portal/merchant), **L**=Leo (chat avatars), **A**=Acme (demo storefront).
  - **End-to-end CodeWithMuh branding:** GitHub link in nav + "Star on GitHub" button in hero; footer "Connect" column → GitHub / YouTube / Website / email; "Built by CodeWithMuh" in footer + copyright; contact page email → `contact@codewithmuh.com` and real socials. Repo URL used: **`github.com/codewithmuh/shopagent`** (confirm/rename if different). Social set: GitHub `@codewithmuh`, YouTube `youtube.com/@codewithmuh`, LinkedIn `linkedin.com/in/muhammad-rashid-daha`, site `codewithmuh.com`, email `contact@codewithmuh.com` — all wired into footers (landing + docs) + contact page.
- **All demo creds verified working (2026-06-05):** live-tested every login API — Django admin (`admin@shopagent.dev`/`demo1234`, **now seeded** as a Merchant superuser), company portal, all 5 merchants, shopper demo, and company API (client_id+secret headers) → all HTTP 200; wrong-password/secret → 401/403. Admin creation added to `seed.py` so `make up` provisions it.
- **Filming cheat sheet:** `docs/DEMO_CREDENTIALS.md` — all surface URLs + copy-paste logins (everything is `demo1234`), company `client_id`/`secret`, the 5 merchants, Shopify connect fields, playground creds, handy `make` commands, and brand/social links.
  - **Docs page legibility** (`/docs`, for screen recording): widened container `max-w-6xl→7xl`, TOC `w-48→56`, and bumped every text size one step (body `sm→base`, micro-labels `xs/10px→sm/xs`, headings `xl→2xl`, `2xl→3xl`).
- **UI polish DONE (2026-06-05):** tagline kept = **"Commerce through conversation"**. Added shared utilities in `globals.css` (`.glass`, `.shadow-soft(-lg)`, `.card-lift`, `.bg-app-gradient`). Frosted glass on demo header + portal/merchant sidebars (over a subtle emerald/teal page gradient); landing "How it works" cards got depth (white + soft shadow + hover lift); added a **"Who it's for"** section (Shoppers / Merchants / Companies) on the landing; explanatory subtitles on the merchant + company dashboards; richer narration-friendly intro on `/docs`. All pages compile 200.
- **Visual rebrand DONE (2026-06-05):** client identity was **indigo + purple**; ShopAgent is now **emerald (primary) + teal (accent)**. Swapped across all 24 frontend files + `globals.css` — Tailwind classes (`indigo-→emerald-`, `purple-/violet-→teal-`), hardcoded hexes (`#6366f1→#10b981`, `#9333ea→#0d9488`, etc.), and glow `rgba`s (both spaced and no-space arbitrary-value shadows). 309 emerald/teal uses, 0 indigo/purple left. Semantic red/green (errors/success) and decorative feature-chip accents (blue/orange/pink) intentionally kept. All pages compile 200, no errors.
- **Next action:** Phase 5 — end-to-end verification: `make up` (build in progress) → confirm migrate+seed+both servers, open localhost:3000, shopper chat → place order → merchant Shopify connect/sync → produce a **filming checklist**. Then Phase 6 (YouTube plan via `/youtube-plan`).
- **Stack verified UP (2026-06-05):** `make up` builds + boots all 4 services (db/redis healthy, backend + frontend serving). Backend `/api/health/` → `200 {"status":"ok"}`; frontend `localhost:3000` → `200` (Turbopack hot reload active); migrate + seed ran (Acme company, 5 merchants, **15 products / 28 variants**, 2 demo users). Backend dev server = `runserver` (ASGI + autoreload).
- **Perf fix:** slimmed `backend/Dockerfile` — removed `build-essential`/`libpq-dev` apt layer (all deps ship arm64 wheels; psycopg2-binary bundles libpq). Build now goes straight to pip wheels, no compilation; leaner image.
- **⚠️ For chat to work:** `.env` currently has a placeholder `ANTHROPIC_API_KEY` — replace with a real key (`docker compose restart backend` after). App/seed/UI all run without it; only Leo's responses need it.

### Phase 5 — End-to-end verification  🔄 IN PROGRESS (2026-06-05)
- [x] `make up` boots; backend health 200; frontend 200; migrate+seed verified.
- [x] **Real Shopify sync verified end-to-end** — connected a live Partners dev store (`codewithmuh.myshopify.com`) via Merchant Portal API (login → `shopify/connect/`): 17 products fetched, synced under Urban Style Co. with real titles/brand/Shopify-CDN images/USD prices. S3 gracefully skipped (no AWS creds → keeps Shopify CDN URLs). Leo's `search_products` tool returns them. Anthropic key confirmed real & loaded.
- **🐞 2 real bugs found & fixed during live test (great on-camera teaching moments):**
  1. `integrations/shopify.py` — sync crashed with `IntegrityError: null value in column "description"`. Shopify sends explicit `null` (not missing keys) for empty `body_html`/`vendor`/`product_type`, so `.get(k, "")` returned `None`. Fixed with `.get(k) or ""` for description/brand/category.
  2. `frontend/.../merchant/products/page.tsx` — product images blank for synced products. Seed images are URL **strings**; Shopify images are **objects** `{src,…}`, so `<img src={obj}>` rendered `[object Object]` (visible as `GET /merchant/[object Object] 404` in logs). Added an `imageUrl()` helper that handles both shapes.
  3. `frontend/.../demo/layout.tsx` — shopper login (`/demo/login`) bounced back to itself. The shared demo layout read `demo_user` from localStorage in a `useEffect([])` (once on mount); since the App-Router layout persists across `/demo/login → /demo/chat`, it never picked up the freshly-set user and the auth guard redirected back. Fixed by re-reading localStorage on `pathname` change and guarding on the fresh value (matches how merchant/portal layouts already work). Merchant + company portal logins were already correct (their effects had `pathname` in deps).
- **Shopify dev-store gotcha (note for the video):** the `shpat_` Admin API token comes ONLY from a **store-admin custom app** (`admin.shopify.com/store/<store>/settings/apps/development` → Develop apps → Create app → scopes → Install → Reveal token once). The **Dev Dashboard** (`dev.shopify.com`) / Partner apps give `shpss_`/`atkn_` (OAuth) which do NOT work as `X-Shopify-Access-Token` (tested → 401). Easy to get lost here.
- [ ] Remaining: full shopper chat → place-order flow with real key; merchant orders/inventory write-back; **filming checklist**.
- **Reference copy (untouched original):** `/Users/rashid/codwithmuh-assitant/ai-stores/`
- **Safe to `git init` now** re: AWS secrets in `DEPLOYMENT.md`/`deploy.sh` (sanitized). Still pending: (1) Muhammad rotates the leaked AWS key in IAM; (2) exclude/sanitize this `CLAUDE.md` before publishing.

## 7. Channel context (for the eventual video)
- CodeWithMuh | AI Automation (~17K subs). Audience: developers/builders.
- Style: practical build-alongs, show the real build. Build agents with **Claude Code**, not n8n.
- License intent reminder: source-available, **not** MIT — commercial use requires permission.

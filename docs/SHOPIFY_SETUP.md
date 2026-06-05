# Connect a Real Shopify Store (Free Dev Store)

This guide walks you through getting **real product data** into ShopAgent on camera —
without paying for a Shopify plan — using a free **Shopify Partners development store**.

By the end, a merchant will connect their Shopify store in the ShopAgent Merchant Portal,
products will sync into the catalog, and the shopper agent (**Leo**) will recommend those
exact products in chat.

> **Don't have a Shopify store?** That's the whole point of this guide. A Partners dev
> store is free, never expires, and comes with test products you can use immediately.

---

## What you'll do

1. Create a free Shopify Partners account
2. Spin up a development store (with sample products)
3. Create a **custom app** and grant it Admin API scopes
4. Copy the **Admin API access token** (`shpat_…`)
5. Paste the store domain + token into the ShopAgent Merchant Portal → **Sync**
6. Watch the products show up in the shopper chat

**Time:** ~10 minutes. **Cost:** $0.

---

## Prerequisites

- ShopAgent running locally — see the main [README](../README.md):
  ```bash
  cp .env.example .env      # add your ANTHROPIC_API_KEY
  make up                   # http://localhost:3000
  ```
- A web browser. No credit card, no paid Shopify plan.

---

## Step 1 — Create a Shopify Partners account

1. Go to **https://partners.shopify.com** and click **Join now**.
2. Sign up (free). Choose any account name; the type can be "Build apps or themes / Other".

The Partner dashboard is where you create unlimited free development stores.

## Step 2 — Create a development store

1. In the Partner dashboard, open **Stores → Add store → Create development store**.
2. Choose **"Create a store to test and build"**.
3. Pick **"Start with test data"** — this pre-loads ~10–20 sample products so you have
   something to sync immediately. (You can also start empty and add products yourself.)
4. Name the store and create it. Note the store URL — it looks like
   **`your-store.myshopify.com`**. You'll need this exact domain later.

> **Tip for the video:** the test-data products are generic (snowboards, etc.). If you
> want products that match your demo script, add a few of your own in **Products → Add
> product** (title, price, an image, and set inventory > 0 so they're in stock).

## Step 3 — Create a custom app (to get an API token)

ShopAgent talks to Shopify with an **Admin API access token** from a custom app you
install on your own store.

1. In your **dev store admin** (not the Partner dashboard), go to
   **Settings → Apps and sales channels → Develop apps**.
2. Click **Allow custom app development** (confirm if prompted), then **Create an app**.
3. Name it e.g. `ShopAgent Sync` and create it.

## Step 4 — Grant Admin API scopes

1. In the app, open the **Configuration** tab → **Admin API integration → Configure**.
2. Enable these scopes:

   | Scope | Why ShopAgent needs it |
   |-------|------------------------|
   | `read_products` | **Required** — sync products, variants, prices, images |
   | `read_inventory` | Read live stock levels |
   | `write_inventory` | Decrement stock in Shopify when a shopper places an order |
   | `read_locations` | Find the inventory location to adjust |

   > Minimum to **just sync and chat**: `read_products`. The inventory scopes enable the
   > live stock write-back when orders are placed through Leo.

3. **Save**.

## Step 5 — Install the app and copy the token

1. Open the **API credentials** tab → **Install app** (confirm).
2. Under **Admin API access token**, click **Reveal token once** and copy it.
   It starts with **`shpat_`**.

> ⚠️ Shopify shows this token **only once**. Copy it now. If you lose it, uninstall and
> reinstall the app to generate a new one.

## Step 6 — Connect the store in the ShopAgent Merchant Portal

1. Open the Merchant Portal at **http://localhost:3000/merchant/login**.
2. Log in as any seeded demo merchant (all use password **`demo1234`**):

   | Email | Store |
   |-------|-------|
   | `store@urbanstyle.com` | Urban Style Co. |
   | `hello@techgadgets.io` | Tech Gadgets Hub |
   | `shop@greenleaf.co` | GreenLeaf Organics |
   | `info@luxwatches.com` | Lux Watches |
   | `support@fitgear.store` | FitGear Athletics |

   (Or sign up a fresh merchant — the Shopify products attach to whichever merchant you're
   logged in as.)
3. Go to **Connections** → **Connect Shopify Store** and fill in:
   - **Shop Domain:** `your-store.myshopify.com` (no `https://`)
   - **Admin API Access Token:** the `shpat_…` token from Step 5
4. Click **Connect Store**.

ShopAgent validates the token, then **syncs products immediately** — you'll see
*"Store connected successfully! Products are syncing."*

## Step 7 — Verify it worked

- **Merchant Portal → Products:** your Shopify products now appear in the catalog.
- **Shopper chat:** open **http://localhost:3000/demo/chat**, log in, and ask Leo for
  something you just synced (e.g. *"show me snowboards"*). Leo searches the live catalog
  and recommends your Shopify products. 🎉

To re-sync after changing products in Shopify:

```bash
make shopify-sync      # re-syncs all connected stores (brand, tags, images, stock)
```

---

## How the sync works (for the build-along)

- Uses the **Shopify Admin REST API** (version `2024-01`).
- On connect, ShopAgent calls `GET /admin/api/2024-01/products.json` and imports each
  product's title, description, images, tags, and variants (price + inventory).
- **Currency normalization:** each merchant's prices are read in the store's own currency,
  then converted to your `DEFAULT_CURRENCY` (default `USD`) for the shopper. Change it in
  `.env`.
- **Product images:** if AWS S3 credentials are set, images are re-hosted on your bucket;
  otherwise ShopAgent keeps the original Shopify CDN URLs (perfectly fine for local/demo).
- **Stock write-back:** when a shopper orders through Leo, ShopAgent decrements the
  variant's inventory in Shopify (needs `write_inventory` + `read_locations`).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| *"Invalid access token. Check your Admin API access token."* (401) | Token is wrong or the app isn't installed. Reinstall the app (Step 5) and copy the fresh `shpat_…`. |
| *"Store not found. Check your shop domain."* (404) | Use the `*.myshopify.com` domain, not your custom domain, and omit `https://`. |
| *"Invalid shop domain…"* | You likely pasted the token into the domain field. Domain = `your-store.myshopify.com`. |
| Connects, but **no products** sync | The store has no products, or the app is missing `read_products`. Add products / enable the scope and run `make shopify-sync`. |
| Out-of-stock products don't appear in chat | Expected — Leo hides items with inventory ≤ 0 when browsing. Set inventory > 0 in Shopify. |

---

## Security note (intentional teaching point)

For this tutorial the Shopify access token is stored **in plaintext** in the database
(`MerchantConnection.access_token_encrypted`, marked `TODO: encrypt in production`). In a
real deployment you'd encrypt it at rest (e.g. envelope encryption with AWS KMS or a
`Fernet` key) and scope it to least privilege. It's left readable here so the data flow is
easy to follow on camera — **don't ship it as-is.**

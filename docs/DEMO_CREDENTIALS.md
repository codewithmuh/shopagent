# Demo Credentials & Links (filming cheat sheet)

All seeded by `make up` / `make seed`. **Every password is `demo1234`.**
These are local demo credentials only — safe to show on camera.

> Start the stack with `make up`, then open http://localhost:3000

---

## 🔗 Surface URLs

| Screen | URL |
|--------|-----|
| Landing page | http://localhost:3000 |
| Shopper demo (chat with Leo) | http://localhost:3000/demo/login |
| Merchant portal | http://localhost:3000/merchant/login |
| Company portal (API keys) | http://localhost:3000/portal/login |
| API Playground | http://localhost:3000/playground |
| Docs | http://localhost:3000/docs |
| Contact | http://localhost:3000/contact |
| Backend health | http://localhost:8000/api/health/ |
| Django admin | http://localhost:8000/admin/ |

---

## 🛒 Shopper demo  — `/demo/login`

```
Email:     demo@acme.com
Password:  demo1234
```
(Second shopper, if needed: `alice@example.com` / `demo1234`)

---

## 🔑 Django admin  — `/admin/`  (http://localhost:8000/admin/)

```
Email:     admin@shopagent.dev
Password:  demo1234
```
(Created automatically by `make up` / `make seed`. Superuser — can browse all data.)

---

## 🏢 Company portal  — `/portal/login`

```
Email:     demo@acme.com
Password:  demo1234
```

API credentials shown on the dashboard (also used by the demo + playground):
```
Client ID:   shopagent_test_demo
Secret Key:  sk_test_demo_secret_key_for_local_development_only
```

---

## 🏪 Merchant portal  — `/merchant/login`  (password `demo1234`)

```
store@urbanstyle.com      Urban Style Co.      (US / USD)
hello@techgadgets.io      Tech Gadgets Hub     (US / USD)
shop@greenleaf.co         GreenLeaf Organics   (GB / GBP)
info@luxwatches.com       Lux Watches          (AE / AED)
support@fitgear.store     FitGear Athletics    (US / USD)
```
Tip: log in as **store@urbanstyle.com** for the Shopify connect demo (that's the one already connected).

---

## 🛍️ Connect Shopify  — Merchant portal → Connections

```
Shop Domain:           codewithmuh.myshopify.com
Admin API Access Token: shpat_…   (your token — keep it off-screen / blur it)
```
Get/rotate the token at:
https://admin.shopify.com/store/codewithmuh/settings/apps/development
(See [SHOPIFY_SETUP.md](SHOPIFY_SETUP.md) for the full walkthrough.)

---

## 🧪 API Playground  — `/playground`

```
client_id:     shopagent_test_demo
secret_key:    sk_test_demo_secret_key_for_local_development_only
user_id:       demo@acme.com
display_name:  Demo User
```

---

## 🔧 Handy commands

```
make up            # start everything (auto-migrate + seed)
make seed          # re-seed demo data
make shopify-sync  # re-sync connected Shopify stores
make reset         # wipe DB volume + rebuild
make superuser     # create a Django admin login
```

---

## 📣 Brand / social links (CodeWithMuh)

```
GitHub:    https://github.com/codewithmuh/shopagent
YouTube:   https://youtube.com/@codewithmuh
LinkedIn:  https://www.linkedin.com/in/muhammad-rashid-daha/
Website:   https://codewithmuh.com
Email:     contact@codewithmuh.com
```

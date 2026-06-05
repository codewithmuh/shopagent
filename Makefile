# ShopAgent — local development shortcuts
# Requires Docker with the Compose v2 plugin (`docker compose`).

# Use `docker compose` (v2); override with `make COMPOSE="docker-compose" ...` if needed.
COMPOSE ?= docker compose

.DEFAULT_GOAL := help
.PHONY: help up up-d down reset seed shopify-sync migrate superuser logs shell ps build

help: ## Show this help
	@echo "ShopAgent — make targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

up: ## Build + start everything (foreground). Auto-migrates and seeds.
	$(COMPOSE) up --build

up-d: ## Same as `up` but detached (background)
	$(COMPOSE) up --build -d

down: ## Stop and remove containers (keeps the database volume)
	$(COMPOSE) down

reset: ## Wipe everything (incl. database volume) and rebuild from scratch
	$(COMPOSE) down -v
	$(COMPOSE) up --build

seed: ## (Re)seed demo merchants, products, company, and users
	$(COMPOSE) exec backend python manage.py seed

shopify-sync: ## Re-sync all connected Shopify stores into the catalog
	$(COMPOSE) exec backend python manage.py backfill_shopify

migrate: ## Apply database migrations
	$(COMPOSE) exec backend python manage.py migrate

superuser: ## Create a Django admin superuser (interactive)
	$(COMPOSE) exec backend python manage.py createsuperuser

logs: ## Tail logs from all services
	$(COMPOSE) logs -f

shell: ## Open a shell in the backend container
	$(COMPOSE) exec backend sh

ps: ## Show running services
	$(COMPOSE) ps

build: ## Rebuild images without starting
	$(COMPOSE) build

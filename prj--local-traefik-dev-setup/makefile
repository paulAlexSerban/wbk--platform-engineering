COMPOSE_FILE := docker-compose.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)

.PHONY: certs compose_up compose_down compose_down_clean db_reset

certs:
	mkdir -p infrastructure/traefik/certs
	mkcert -install
	mkcert -cert-file infrastructure/traefik/certs/local.pem \
		-key-file  infrastructure/traefik/certs/local-key.pem \
		local.api.traefik-poc.local \
		local.site.traefik-poc.local \
		local.app.traefik-poc.local \
		local.assets.traefik-poc.local

compose_up:
	$(COMPOSE) up --build

compose_down:
	$(COMPOSE) down

compose_down_clean:
	$(COMPOSE) down -v

db_reset:
	$(COMPOSE) down -v
	$(COMPOSE) up -d postgres

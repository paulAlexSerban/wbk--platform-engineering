# Local Traefik Dev Setup

A standalone proof of concept for running a multi-service stack behind Traefik on trusted local HTTPS subdomains - no port numbers in the browser, no certificate warnings.

This is the prototype of the pattern used in production by [prj--personal-portfolio--v3](https://github.com/paulAlexSerban/prj--personal-portfolio--v3).

## What it demonstrates

Four services sit on sibling subdomains, the same way production sites split across `*.paulserban.eu`:

| Service                               | URL                                    |
| ------------------------------------- | -------------------------------------- |
| BE API (Express + Postgres CRUD)      | https://local.api.traefik-poc.local    |
| SSR site (Express, server-side fetch) | https://local.site.traefik-poc.local   |
| SPA (Vite + React, browser fetch)     | https://local.app.traefik-poc.local    |
| Static assets (nginx)                 | https://local.assets.traefik-poc.local |
| Traefik dashboard                     | http://localhost:8080                  |

The interesting split is how data is fetched:

- The **SSR site** calls the API **server-to-server** over the Docker network (`http://api:4000`).
- The **SPA** calls the API **from the browser** through Traefik (`https://local.api.traefik-poc.local`) - a genuine cross-origin request.
- Product images load from the **assets** subdomain over HTTPS.

That is the class of behaviour (`CORS`, cookie scope, mixed content, HMR over WSS) that `localhost:PORT` never exercises.

```text
Browser ──► Traefik (:443, TLS)
              ├── local.api.traefik-poc.local    → api        (:4000)
              ├── local.site.traefik-poc.local   → ssr-site   (:3000)
              ├── local.app.traefik-poc.local    → spa-app    (:5173)
              ├── local.assets.traefik-poc.local → assets     (:80)
              └── HTTP :80 → HTTPS redirect
```

## Quick start

Prerequisites and `/etc/hosts` / mkcert steps: [`_docs/local-dev-setup.md`](_docs/local-dev-setup.md).

```bash
make certs
make compose_up
```

Then open https://local.site.traefik-poc.local and https://local.app.traefik-poc.local.

Stop with `make compose_down`. Drop the Postgres volume with `make compose_down_clean`.

## Layout

```
database/init/              Postgres schema + seed
infrastructure/traefik/     Traefik static + dynamic TLS config
services/api/               Express CRUD API
services/ssr-site/          Express SSR
services/spa-app/           Vite + React CSR
services/assets-server/     nginx static files
```

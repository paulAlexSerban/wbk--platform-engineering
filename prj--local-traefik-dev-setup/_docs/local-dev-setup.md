# Local development setup

Run the API, SSR site, SPA, and static asset server behind Traefik on HTTPS with local domain names - no port numbers in the browser URL.

| Service           | URL                                    |
| ----------------- | -------------------------------------- |
| BE API            | https://local.api.traefik-poc.local    |
| SSR site          | https://local.site.traefik-poc.local   |
| SPA               | https://local.app.traefik-poc.local    |
| Static assets     | https://local.assets.traefik-poc.local |
| Traefik dashboard | http://localhost:8080                  |

HTTP (port 80) redirects to HTTPS (port 443).

## Prerequisites

Install these once on the host machine.

### 1. Docker Engine + Compose plugin

Follow the [official Docker install guide](https://docs.docker.com/engine/install/) for your OS, then confirm:

```bash
docker --version
docker compose version
```

On Linux, add your user to the `docker` group and log out/in:

```bash
sudo usermod -aG docker "$USER"
```

### 2. mkcert (trusted local HTTPS certificates)

Install mkcert from [GitHub releases](https://github.com/FiloSottile/mkcert/releases) or your package manager, then install the local CA:

```bash
mkcert -install
```

On Debian / Ubuntu you can also download a release binary:

```bash
sudo apt-get install -y libnss3-tools curl

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) MKCERT_ARCH="amd64" ;;
  aarch64) MKCERT_ARCH="arm64" ;;
  armv7l) MKCERT_ARCH="arm" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

curl -fsSL "https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-linux-${MKCERT_ARCH}" \
  -o /tmp/mkcert
chmod +x /tmp/mkcert
sudo mv /tmp/mkcert /usr/local/bin/mkcert
mkcert -install
```

### 3. Local DNS via `/etc/hosts`

Map the local domains to this machine. Traefik listens on ports 80 and 443; the hostnames must resolve to `127.0.0.1`.

```bash
sudo tee -a /etc/hosts <<'EOF'
127.0.0.1  local.api.traefik-poc.local
127.0.0.1  local.site.traefik-poc.local
127.0.0.1  local.app.traefik-poc.local
127.0.0.1  local.assets.traefik-poc.local
EOF
```

Verify:

```bash
getent hosts local.api.traefik-poc.local
```

## One-time project setup

From the repository root, generate TLS certificates:

```bash
make certs
```

That writes `infrastructure/traefik/certs/local.pem` and `local-key.pem`. Certificate files are gitignored; regenerate if you delete the certs directory.

## Start the stack

```bash
make compose_up
```

Or:

```bash
docker compose up --build
```

Add `-d` to run in the background. Stop:

```bash
make compose_down
```

Drop the Postgres volume (and re-run init/seed on next start):

```bash
make compose_down_clean
```

Reset only the database volume, then bring Postgres back:

```bash
make db_reset
```

## How it works

```
Browser ──► Traefik (:443, TLS)
              ├── local.api.traefik-poc.local    → api        (:4000)
              ├── local.site.traefik-poc.local   → ssr-site   (:3000)
              ├── local.app.traefik-poc.local    → spa-app    (:5173)
              ├── local.assets.traefik-poc.local → assets     (:80)
              └── HTTP :80 → HTTPS redirect
```

- **Traefik** is the reverse proxy and TLS terminator. Routing is by `Host` header.
- **mkcert** provides browser-trusted certificates for the four local subdomains.
- **Postgres** holds a `products` table. Schema and seed SQL live in `database/init/` and run on first volume create.
- The **SSR site** fetches product JSON **server-to-server** over the Docker network (`http://api:4000`).
- The **SPA** fetches the same JSON **from the browser** through Traefik (`https://local.api.traefik-poc.local`) - a genuine cross-origin request.
- Product images load from the **assets** subdomain over HTTPS.

That split is the point of the prototype: cookie scope, CORS, mixed content, and HMR-over-WSS only show up once services live on sibling HTTPS subdomains.

## Troubleshooting

### `permission denied` on Docker socket

```bash
sudo usermod -aG docker "$USER"
# log out and back in, then:
docker ps
```

### `connection refused` on port 443

- Confirm Docker is running.
- Check the stack: `docker compose ps`
- Ensure nothing else binds ports 80/443:

```bash
sudo ss -tlnp | grep -E ':80|:443'
```

### Certificate / HTTPS warnings

- Re-run `mkcert -install` and `make certs`.
- Restart the stack after replacing cert files.

### `Blocked request. This host is not allowed` (Vite)

The SPA Docker image allows `local.app.traefik-poc.local`. Rebuild the SPA container after pulling config changes:

```bash
docker compose up --build spa-app
```

### SPA cannot load products (CORS / mixed content)

- Confirm you are on `https://local.app.traefik-poc.local`, not `http://`.
- The API CORS allow-list is `https://local.app.traefik-poc.local` and `https://local.site.traefik-poc.local`.
- Check Traefik routing in the dashboard at http://localhost:8080.

### Hostname does not resolve

- Re-check `/etc/hosts` entries.
- `getent hosts local.site.traefik-poc.local` should return `127.0.0.1`.

### Empty catalogue / missing seed data

Postgres init scripts only run against an empty volume. Reset with `make compose_down_clean` then `make compose_up`.

## Related files

- Makefile targets: [`makefile`](../makefile) (`certs`, `compose_up`, `compose_down`, `compose_down_clean`, `db_reset`)
- Compose: [`docker-compose.yml`](../docker-compose.yml)
- Traefik config: [`infrastructure/traefik/`](../infrastructure/traefik/)
- API: [`services/api/`](../services/api/)
- SSR site: [`services/ssr-site/`](../services/ssr-site/)
- SPA: [`services/spa-app/`](../services/spa-app/)
- Assets: [`services/assets-server/`](../services/assets-server/)

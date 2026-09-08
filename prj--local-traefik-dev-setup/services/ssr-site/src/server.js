import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { layout } from './views/layout.js';
import { listView } from './views/list.js';
import { detailView, notFoundView } from './views/detail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const apiInternalUrl = process.env.API_INTERNAL_URL || 'http://api:4000';
const apiPublicUrl = process.env.API_PUBLIC_URL || 'https://local.api.traefik-poc.local';
const assetsUrl = process.env.ASSETS_PUBLIC_URL || 'https://local.assets.traefik-poc.local';
const siteUrl = process.env.SITE_URL || 'https://local.site.traefik-poc.local';
const appUrl = process.env.APP_URL || 'https://local.app.traefik-poc.local';

const app = express();

app.use('/static', express.static(path.join(__dirname, '../public')));

function page(title, body) {
    return layout({
        title,
        siteUrl,
        appUrl,
        apiPublicUrl,
        assetsUrl,
        body,
    });
}

async function fetchJson(pathname) {
    const response = await fetch(`${apiInternalUrl}${pathname}`);
    const body = await response.json().catch(() => null);

    if (!response.ok) {
        const message = body?.error || `API responded with ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    return body;
}

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.get('/', async (_req, res) => {
    try {
        const products = await fetchJson('/api/products');
        res.type('html').send(
            page('Catalogue · Traefik POC', listView({ products, assetsUrl }))
        );
    } catch (error) {
        console.error(error);
        res.status(502).type('html').send(
            page('Catalogue · Traefik POC', listView({ products: [], assetsUrl, error: error.message }))
        );
    }
});

app.get('/products/:id', async (req, res) => {
    try {
        const product = await fetchJson(`/api/products/${req.params.id}`);
        res.type('html').send(
            page(`${product.name} · Traefik POC`, detailView({ product, assetsUrl }))
        );
    } catch (error) {
        const status = error.status === 404 ? 404 : 502;
        console.error(error);
        res.status(status).type('html').send(page('Not found · Traefik POC', notFoundView()));
    }
});

app.use((_req, res) => {
    res.status(404).type('html').send(page('Not found · Traefik POC', notFoundView()));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`ssr-site listening on ${port}`);
    console.log(`api internal url: ${apiInternalUrl}`);
});

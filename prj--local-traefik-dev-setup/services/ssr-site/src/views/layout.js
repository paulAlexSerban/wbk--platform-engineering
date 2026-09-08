export function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function formatPrice(price) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'EUR',
    }).format(Number(price));
}

export function layout({ title, siteUrl, appUrl, apiPublicUrl, assetsUrl, body }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    <header class="masthead">
        <p class="kicker">SSR · server-side fetch</p>
        <h1><a href="/">Traefik POC Catalogue</a></h1>
        <nav>
            <a href="${escapeHtml(siteUrl)}">Site</a>
            <a href="${escapeHtml(appUrl)}">App</a>
            <a href="${escapeHtml(apiPublicUrl)}/api/products">API</a>
            <a href="${escapeHtml(assetsUrl)}/images/notebook.svg">Assets</a>
        </nav>
    </header>
    <main>
        ${body}
    </main>
    <footer>
        <p>This page is rendered on the server. Product JSON is fetched from the API over the Docker network; images load from the assets subdomain over HTTPS.</p>
    </footer>
</body>
</html>`;
}

import { escapeHtml, formatPrice } from './layout.js';

export function listView({ products, assetsUrl, error }) {
    if (error) {
        return `
            <p class="lede">Could not load products from the API.</p>
            <p class="error">${escapeHtml(error)}</p>
        `;
    }

    const cards = products
        .map(
            (product) => `
            <article class="card">
                <a href="/products/${product.id}">
                    <img
                        src="${escapeHtml(assetsUrl)}/images/${escapeHtml(product.image_filename)}"
                        alt="${escapeHtml(product.name)}"
                        width="160"
                        height="160"
                    >
                    <h2>${escapeHtml(product.name)}</h2>
                    <p class="price">${formatPrice(product.price)}</p>
                    <p>${escapeHtml(product.description)}</p>
                </a>
            </article>
        `
        )
        .join('');

    return `
        <p class="lede">A server-rendered catalogue. Each request hits the API from inside the Docker network, then HTML is sent to the browser.</p>
        <section class="grid">
            ${cards}
        </section>
    `;
}

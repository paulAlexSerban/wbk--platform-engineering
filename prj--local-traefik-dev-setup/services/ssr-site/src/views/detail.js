import { escapeHtml, formatPrice } from './layout.js';

export function detailView({ product, assetsUrl }) {
    return `
        <p class="back"><a href="/">← All products</a></p>
        <article class="detail">
            <img
                src="${escapeHtml(assetsUrl)}/images/${escapeHtml(product.image_filename)}"
                alt="${escapeHtml(product.name)}"
                width="240"
                height="240"
            >
            <div>
                <h2>${escapeHtml(product.name)}</h2>
                <p class="price">${formatPrice(product.price)}</p>
                <p>${escapeHtml(product.description)}</p>
            </div>
        </article>
    `;
}

export function notFoundView() {
    return `
        <p class="lede">Product not found.</p>
        <p class="back"><a href="/">← All products</a></p>
    `;
}

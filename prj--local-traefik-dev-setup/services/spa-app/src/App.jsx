import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://local.api.traefik-poc.local';
const ASSETS_URL = import.meta.env.VITE_ASSETS_URL || 'https://local.assets.traefik-poc.local';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://local.site.traefik-poc.local';
const APP_URL = import.meta.env.VITE_APP_URL || 'https://local.app.traefik-poc.local';

const emptyForm = {
    name: '',
    description: '',
    price: '',
    image_filename: 'notebook.svg',
};

const IMAGE_OPTIONS = [
    'notebook.svg',
    'fountain-pen.svg',
    'desk-lamp.svg',
    'ceramic-mug.svg',
    'headphones.svg',
];

function formatPrice(price) {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'EUR',
    }).format(Number(price));
}

export default function App() {
    const [products, setProducts] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    async function loadProducts() {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/products`);
            if (!response.ok) {
                throw new Error(`API responded with ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProducts();
    }, []);

    function startCreate() {
        setSelectedId(null);
        setForm(emptyForm);
    }

    function startEdit(product) {
        setSelectedId(product.id);
        setForm({
            name: product.name,
            description: product.description,
            price: String(product.price),
            image_filename: product.image_filename,
        });
    }

    async function submitForm(event) {
        event.preventDefault();
        setError('');

        const payload = {
            name: form.name,
            description: form.description,
            price: Number(form.price),
            image_filename: form.image_filename,
        };

        const url = selectedId
            ? `${API_URL}/api/products/${selectedId}`
            : `${API_URL}/api/products`;

        try {
            const response = await fetch(url, {
                method: selectedId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const body = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(body?.error || `API responded with ${response.status}`);
            }

            await loadProducts();
            startCreate();
        } catch (submitError) {
            setError(submitError.message);
        }
    }

    async function deleteProduct(id) {
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/products/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok && response.status !== 204) {
                throw new Error(`API responded with ${response.status}`);
            }

            if (selectedId === id) {
                startCreate();
            }

            await loadProducts();
        } catch (deleteError) {
            setError(deleteError.message);
        }
    }

    return (
        <>
            <header className="masthead">
                <p className="kicker">SPA · browser fetch</p>
                <h1>Traefik POC App</h1>
                <nav>
                    <a href={SITE_URL}>Site</a>
                    <a href={APP_URL}>App</a>
                    <a href={`${API_URL}/api/products`}>API</a>
                    <a href={`${ASSETS_URL}/images/notebook.svg`}>Assets</a>
                </nav>
            </header>

            <main>
                <p className="lede">
                    This React app fetches product JSON from the API through Traefik
                    ({API_URL}) and loads images from the assets subdomain. That request
                    is cross-origin HTTPS - the path localhost ports never take.
                </p>

                {error ? <p className="error">{error}</p> : null}
                {loading ? <p>Loading catalogue…</p> : null}

                <section className="layout">
                    <div className="grid">
                        {products.map((product) => (
                            <article className="card" key={product.id}>
                                <img
                                    src={`${ASSETS_URL}/images/${product.image_filename}`}
                                    alt={product.name}
                                    width="160"
                                    height="160"
                                />
                                <h2>{product.name}</h2>
                                <p className="price">{formatPrice(product.price)}</p>
                                <p>{product.description}</p>
                                <div className="actions">
                                    <button type="button" onClick={() => startEdit(product)}>
                                        Edit
                                    </button>
                                    <button type="button" onClick={() => deleteProduct(product.id)}>
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    <form className="editor" onSubmit={submitForm}>
                        <h2>{selectedId ? `Edit product #${selectedId}` : 'Add product'}</h2>
                        <label>
                            Name
                            <input
                                value={form.name}
                                onChange={(event) => setForm({ ...form, name: event.target.value })}
                                required
                            />
                        </label>
                        <label>
                            Description
                            <textarea
                                value={form.description}
                                onChange={(event) =>
                                    setForm({ ...form, description: event.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Price
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={(event) =>
                                    setForm({ ...form, price: event.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Image
                            <select
                                value={form.image_filename}
                                onChange={(event) =>
                                    setForm({ ...form, image_filename: event.target.value })
                                }
                            >
                                {IMAGE_OPTIONS.map((filename) => (
                                    <option key={filename} value={filename}>
                                        {filename}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="actions">
                            <button type="submit">{selectedId ? 'Save' : 'Create'}</button>
                            <button type="button" onClick={startCreate}>
                                Reset
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </>
    );
}

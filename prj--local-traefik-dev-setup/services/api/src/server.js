import cors from 'cors';
import express from 'express';
import { waitForDb } from './db.js';
import productsRouter from './routes/products.js';

const port = Number(process.env.PORT || 4000);
const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const app = express();

app.use(
    cors({
        origin: corsOrigins,
    })
);
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/products', productsRouter);

app.use((_req, res) => {
    res.status(404).json({ error: 'not found' });
});

try {
    await waitForDb();
    app.listen(port, '0.0.0.0', () => {
        console.log(`api listening on ${port}`);
        console.log(`cors origins: ${corsOrigins.join(', ') || '(none)'}`);
    });
} catch (error) {
    console.error(error);
    process.exit(1);
}

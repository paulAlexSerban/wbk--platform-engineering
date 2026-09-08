import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

function mapProduct(row) {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        image_filename: row.image_filename,
        created_at: row.created_at,
    };
}

function parseProductBody(body) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const image_filename =
        typeof body.image_filename === 'string' && body.image_filename.trim()
            ? body.image_filename.trim()
            : 'notebook.svg';
    const price = Number(body.price);

    const errors = [];

    if (!name) errors.push('name is required');
    if (!description) errors.push('description is required');
    if (!Number.isFinite(price) || price < 0) errors.push('price must be a non-negative number');

    return { values: { name, description, price, image_filename }, errors };
}

router.get('/', async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, description, price, image_filename, created_at FROM products ORDER BY id ASC'
        );
        res.json(result.rows.map(mapProduct));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'failed to list products' });
    }
});

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'invalid product id' });
        return;
    }

    try {
        const result = await pool.query(
            'SELECT id, name, description, price, image_filename, created_at FROM products WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'product not found' });
            return;
        }

        res.json(mapProduct(result.rows[0]));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'failed to load product' });
    }
});

router.post('/', async (req, res) => {
    const { values, errors } = parseProductBody(req.body);

    if (errors.length > 0) {
        res.status(400).json({ error: errors.join(', ') });
        return;
    }

    try {
        const result = await pool.query(
            `INSERT INTO products (name, description, price, image_filename)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, description, price, image_filename, created_at`,
            [values.name, values.description, values.price, values.image_filename]
        );
        res.status(201).json(mapProduct(result.rows[0]));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'failed to create product' });
    }
});

router.put('/:id', async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'invalid product id' });
        return;
    }

    const { values, errors } = parseProductBody(req.body);

    if (errors.length > 0) {
        res.status(400).json({ error: errors.join(', ') });
        return;
    }

    try {
        const result = await pool.query(
            `UPDATE products
             SET name = $1, description = $2, price = $3, image_filename = $4
             WHERE id = $5
             RETURNING id, name, description, price, image_filename, created_at`,
            [values.name, values.description, values.price, values.image_filename, id]
        );

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'product not found' });
            return;
        }

        res.json(mapProduct(result.rows[0]));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'failed to update product' });
    }
});

router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        res.status(400).json({ error: 'invalid product id' });
        return;
    }

    try {
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            res.status(404).json({ error: 'product not found' });
            return;
        }

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'failed to delete product' });
    }
});

export default router;

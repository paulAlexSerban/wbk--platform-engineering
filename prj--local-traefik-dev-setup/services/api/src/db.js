import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}

export const pool = new Pool({ connectionString });

export async function waitForDb(retries = 30) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            await pool.query('SELECT 1');
            return;
        } catch (error) {
            lastError = error;
            await new Promise((resolve) => {
                setTimeout(resolve, 1000);
            });
        }
    }

    throw new Error(`database unavailable after ${retries}s: ${lastError?.message}`);
}

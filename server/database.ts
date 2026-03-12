/**
 * Configuration PostgreSQL - Micro-Gestion Facile
 * ===============================================
 * Pool de connexion et configuration DB
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

/**
 * Configuration du pool de connexion PostgreSQL
 * Pour Node.js/Express avec support TypeScript
 */
export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'micro_gestion_facile',

  // Si la DB est en SSL (recommandé en production)
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        }
      : false,

  // Pool settings
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Max connexions
  idleTimeoutMillis: 30000, // Idle timeout 30s
  connectionTimeoutMillis: 2000, // Connect timeout 2s

  // Application name for better logging
  application_name: 'micro-gestion-facile',
});

/**
 * Event listeners pour le pool
 */
pool.on('error', (err) => {
  console.error('❌ Erreur de pool PostgreSQL non gérée:', err);
  // Alert/monitoring service could be called here
});

pool.on('connect', () => {
  if (process.env.DEBUG === 'true') {
    console.log('✅ Nouvelle connexion établie au pool');
  }
});

/**
 * Health check pour la DB
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Erreur de connexion à la base de données:', err);
    return false;
  }
}

/**
 * Query helper avec logging
 */
export async function query<T = any>(text: string, values?: unknown[]): Promise<T[]> {
  const query = {
    text,
    values,
  };

  if (process.env.DEBUG === 'true') {
    console.log('🔍 Query:', query);
  }

  try {
    const start = Date.now();
    const res = await pool.query(query);
    const duration = Date.now() - start;

    if (process.env.DEBUG === 'true') {
      console.log(`✅ Query exécutée en ${duration}ms`);
    }

    return res.rows;
  } catch (error) {
    console.error('❌ Erreur DB:', error);
    throw error;
  }
}

/**
 * Transaction helper
 */
export async function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Fermer le pool (graceful shutdown)
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('✅ Pool PostgreSQL fermé');
}

export default pool;

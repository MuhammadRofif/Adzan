import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'adzan_challenge',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('Database connection established');
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

// Export query function
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// Export pool for transactions
export const getClient = (): Promise<PoolClient> => {
  return pool.connect();
};

// Export pool for graceful shutdown
export const closePool = async () => {
  await pool.end();
  console.log('Database pool closed');
};

export default pool;

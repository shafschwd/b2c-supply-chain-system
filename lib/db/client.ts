// /lib/db/client.ts

import { Pool } from 'pg';

// Database connection details
const connectionConfig = {
  user: process.env.DB_USER || 'scm_user',
  password: process.env.DB_PASSWORD || '123456',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'supply_chain_db',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false,
};

// Create a connection pool to manage multiple connections efficiently
const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Utility function to execute SQL queries
export const query = (text: string, params?: any[]) => pool.query(text, params);

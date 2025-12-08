// /lib/db/client.ts

import { Pool } from 'pg';

// Database connection details
const connectionConfig = {
  user: 'scm_user',
  password: '123456', // The password you specified
  host: 'localhost', // Assuming PostgreSQL is running locally (default)
  database: 'supply_chain_db',
  port: 5432, // Default PostgreSQL port
};

// Create a connection pool to manage multiple connections efficiently
const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Utility function to execute SQL queries
export const query = (text: string, params?: any[]) => pool.query(text, params);

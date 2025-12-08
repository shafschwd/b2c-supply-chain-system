// /lib/db/users.ts

import { query } from '@/lib/db/client'; // PostgreSQL client connection
import { User, UserRole } from '@/types/user';
import bcrypt from 'bcrypt';
import { QueryResult } from 'pg';

const SALT_ROUNDS = 10;

// --- Helper function to select non-sensitive fields ---
const USER_FIELDS = 'id, name, email, role, address, wallet_balance';

// --- Login Handler ---
export async function login(
  email: string,
  password: string
): Promise<User | null> {
  const text = `SELECT ${USER_FIELDS}, password_hash FROM users WHERE email = $1`;
  const values = [email];

  try {
    const result: QueryResult = await query(text, values);
    if (result.rows.length === 0) return null;

    const userRow = result.rows[0];
    const match = await bcrypt.compare(password, userRow.password_hash);

    if (!match) return null;

    const { password_hash, ...user } = userRow;
    return user as User;
  } catch (error) {
    console.error('Database query error (login):', error);
    return null;
  }
}

// --- Registration Handler ---
export async function registerUser(user: User): Promise<User> {
  const { name, email, password, role, address, wallet_balance, id } = user;

  const existing = await query('SELECT email FROM users WHERE email = $1', [
    email,
  ]);
  if (existing.rows.length > 0)
    throw new Error('User with this email already exists.');

  const passwordHash = await bcrypt.hash(password!, SALT_ROUNDS);

  const text =
    'INSERT INTO users (id, name, email, role, address, wallet_balance, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
  const values = [
    id,
    name,
    email,
    role,
    address,
    wallet_balance || 0,
    passwordHash,
  ];

  try {
    const result: QueryResult = await query(text, values);
    const userRow = result.rows[0];
    const { password_hash, ...newUser } = userRow;
    return newUser as User;
  } catch (error) {
    console.error('Database insertion error (registerUser):', error);
    throw new Error('Registration failed due to a database error.');
  }
}

/**
 * Fully implemented function to update only non-sensitive profile fields.
 * This is used for the "Edit Profile" functionality.
 */
export async function updateUser(user: Partial<User>): Promise<User | null> {
  if (!user.id) return null;

  const fields = [];
  const values = [];
  let index = 1;

  // 1. Check for Name update
  if (user.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(user.name);
  }
  // 2. Check for Address update
  if (user.address !== undefined) {
    fields.push(`address = $${index++}`);
    values.push(user.address);
  }
  // NOTE: wallet_balance update is handled by the dedicated transaction logic.

  if (fields.length === 0) {
    // If nothing changed, just fetch the existing user
    return (
      await query(`SELECT ${USER_FIELDS} FROM users WHERE id = $1`, [user.id])
    ).rows[0] as User;
  }

  const text = `UPDATE users SET ${fields.join(
    ', '
  )} WHERE id = $${index} RETURNING ${USER_FIELDS}`;
  values.push(user.id);

  try {
    const result: QueryResult = await query(text, values);
    return result.rows.length > 0 ? (result.rows[0] as User) : null;
  } catch (error) {
    console.error('Database query error (updateUser):', error);
    return null;
  }
}

// --- Existing functions (simplified SELECT) ---
export async function getUserByEmail(email: string): Promise<User | null> {
  const text = `SELECT ${USER_FIELDS} FROM users WHERE email = $1`;
  try {
    const result: QueryResult = await query(text, [email]);
    return result.rows.length > 0 ? (result.rows[0] as User) : null;
  } catch (error) {
    console.error('Database query error (getUserByEmail):', error);
    return null;
  }
}

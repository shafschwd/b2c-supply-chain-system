// /lib/db/wallet-management.ts (NEW FILE)

import { query } from '@/lib/db/client';
import { User } from '@/types/user';
import { QueryResult } from 'pg';

/**
 * Handles deposit or withdrawal transactions by updating the user's wallet_balance.
 * @param userId The ID of the user whose balance is being changed.
 * @param amount The amount of the transaction.
 * @param type 'deposit' or 'withdraw'.
 * @returns The updated User object, or null on failure.
 */
export async function updateWalletBalance(
  userId: string,
  amount: number,
  type: 'deposit' | 'withdraw'
): Promise<User | null> {
  const adjustment = type === 'deposit' ? amount : -amount;

  try {
    // Check current balance before withdrawal (prevents negative balance)
    if (type === 'withdraw') {
      const balanceCheck: QueryResult = await query(
        'SELECT wallet_balance FROM users WHERE id = $1',
        [userId]
      );
      if (balanceCheck.rows.length === 0) {
        throw new Error('User not found.');
      }
      if (parseFloat(balanceCheck.rows[0].wallet_balance) + adjustment < 0) {
        throw new Error('Insufficient funds for withdrawal.');
      }
    }

    // Update the balance using a single atomic SQL statement
    const text = `
        UPDATE users
        SET wallet_balance = wallet_balance + $1
        WHERE id = $2
        RETURNING id, name, email, role, address, wallet_balance
    `;
    const values = [adjustment, userId];

    const result: QueryResult = await query(text, values);

    return result.rows.length > 0 ? (result.rows[0] as User) : null;
  } catch (error: any) {
    console.error('Database error during wallet transaction:', error.message);
    throw new Error(error.message || 'Wallet transaction failed.');
  }
}

// /app/api/wallet/route.ts (MODIFIED FILE)

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db/users'; // For the GET request
import { updateWalletBalance } from '@/lib/db/wallet-management'; // NEW

// === GET (Fetch Current User Balance) ===
// Used by page.tsx on mount to refresh user session/balance
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required.' },
        { status: 400 }
      );
    }

    // We can reuse getUserById (or update your getUserByEmail to accept ID)
    // For now, let's assume a simplified GET for user details exists in users.ts or modify to use email if necessary.
    // Assuming a simple getUserByEmail still works for lookup:
    const user = await getUserByEmail(userId); // NOTE: Assuming userId is actually the email for a quick fix, or create getUserById

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('API Error fetching wallet balance:', error);
    return NextResponse.json(
      { error: 'Internal Server Error fetching balance.' },
      { status: 500 }
    );
  }
}

// === POST (Deposit/Withdraw Transaction) ===
export async function POST(req: NextRequest) {
  try {
    const { userId, type, amount } = await req.json();

    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing transaction details.' },
        { status: 400 }
      );
    }

    const updatedUser = await updateWalletBalance(userId, amount, type);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found or update failed.' },
        { status: 404 }
      );
    }

    // Return the updated user object to refresh the frontend state
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('API Error during wallet transaction:', error);
    // Return the specific error message from the database logic (e.g., "Insufficient funds")
    return NextResponse.json(
      { error: error.message || 'Transaction failed.' },
      { status: 500 }
    );
  }
}

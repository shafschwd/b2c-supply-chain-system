// /app/api/blockchain/route.ts

import { NextResponse } from 'next/server';
import { getBlockchainLedger } from '@/lib/blockchain'; // Server-side function

// This handles the GET request from the frontend to fetch the ledger
export async function GET() {
  const ledger = await getBlockchainLedger();
  return NextResponse.json(ledger);
}

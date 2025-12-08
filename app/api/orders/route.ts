// /app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrdersAndShipments,
  updateOrderStatusTransaction,
  collectPaymentTransaction,
} from '@/lib/db/order-management';
import { User, UserRole } from '@/types/user';
import { OrderStatus } from '@/types/order';

// === GET (Read Orders and Shipments) ===
export async function GET(req: NextRequest) {
  // Note: In a real system, the user should be retrieved securely from the session/token, not query params.
  const userId = req.nextUrl.searchParams.get('userId');
  const userRole = req.nextUrl.searchParams.get('userRole') as UserRole;

  if (!userId || !userRole) {
    return NextResponse.json(
      { error: 'User context is required' },
      { status: 400 }
    );
  }

  const user: User = { id: userId, role: userRole } as User; // Minimal user object for fetching

  const data = await getOrdersAndShipments(user);
  return NextResponse.json(data);
}

// === POST (Update Status or Collect Payment) ===
export async function POST(req: NextRequest) {
  try {
    const { action, orderId, newStatus, userId } = await req.json();

    if (action === 'updateStatus' && orderId && newStatus && userId) {
      const txHash = await updateOrderStatusTransaction(
        orderId,
        newStatus as OrderStatus,
        userId
      );
      return NextResponse.json({
        message: 'Status updated and recorded on chain.',
        txHash,
      });
    }

    if (action === 'collectPayment' && orderId && userId) {
      const txHash = await collectPaymentTransaction(orderId, userId); // userId is the Seller ID here
      return NextResponse.json({
        message: 'Payment collected and recorded on chain.',
        txHash,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('API Error during order mutation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

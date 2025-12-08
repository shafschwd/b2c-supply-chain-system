// /app/api/order/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createOrderTransaction } from '@/lib/db/transactions';
import { Item } from '@/types/item';
import { User } from '@/types/user';

// === POST (Create Order) ===
export async function POST(req: NextRequest) {
  try {
    // Receive necessary data from client
    const { buyer, item } = (await req.json()) as { buyer: User; item: Item };

    if (!buyer || !item) {
      return NextResponse.json(
        { error: 'Missing buyer or item data' },
        { status: 400 }
      );
    }

    // Execute the atomic server-side transaction
    const result = await createOrderTransaction(buyer, item);

    return NextResponse.json({
      message: 'Order successfully placed.',
      orderId: result.order.order_id,
      txHash: result.txHash,
    });
  } catch (error: any) {
    console.error('API Error during order creation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

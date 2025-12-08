// /app/api/shipments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveShipments,
  updateShipmentLocationTransaction,
} from '@/lib/db/shipment-management';
import { getOrdersAndShipments } from '@/lib/db/order-management'; // Reuse to get order data

// === GET (Read Shipments and Orders) ===
export async function GET() {
  // In a production system, this would be filtered by the Logistics Provider's assigned shipments.
  // For simplicity, we fetch all active shipments and orders required for display.
  const shipments = await getActiveShipments();

  // NOTE: Orders are needed to check for 'Seller Approval Pending' status.
  // Assuming a way to quickly fetch all orders associated with these shipments.
  const orders = await getOrdersAndShipments({ role: 'LOGISTICS' } as any).then(
    (res) => res.orders
  );

  return NextResponse.json({ shipments, orders });
}

// === POST (Update Shipment Location) ===
export async function POST(req: NextRequest) {
  try {
    const { shipmentId, newLocation, userId, orderId } = await req.json();

    if (!shipmentId || !newLocation || !userId || !orderId) {
      return NextResponse.json(
        { error: 'Missing shipment, location, or user context' },
        { status: 400 }
      );
    }

    const txHash = await updateShipmentLocationTransaction(
      shipmentId,
      newLocation,
      userId,
      orderId
    );

    return NextResponse.json({
      message: 'Shipment updated and recorded on chain.',
      txHash,
    });
  } catch (error: any) {
    console.error('API Error during shipment update:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

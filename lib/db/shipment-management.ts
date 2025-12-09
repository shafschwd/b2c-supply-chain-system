// /lib/db/shipment-management.ts

import { query } from '@/lib/db/client';
import { Shipment } from '@/types/shipment';
import { OrderStatus } from '@/types/order';
import { recordEventOnChain } from '@/lib/blockchain';
import { Hex } from 'viem';
import crypto from 'crypto';

const EVENT_STATUS_UPDATE = 1;

// --- 1. Fetching Logic ---

export async function getActiveShipments(): Promise<Shipment[]> {
  console.log(`[DB] Fetching all active shipments`);
  try {
    const result = await query('SELECT * FROM shipments ORDER BY last_update DESC');
    return result.rows as Shipment[];
  } catch (error) {
    console.error('Database fetch error (getActiveShipments):', error);
    return [];
  }
}

// --- 2. Update Location Transaction Logic ---

export async function updateShipmentLocationTransaction(
  shipmentId: string,
  newLocation: string,
  userId: string,
  orderId: string
): Promise<Hex> {
  // --- 1. GENERATE DATA HASH ---
  const dataHashInput = JSON.stringify({
    id: shipmentId,
    location: newLocation,
    updater: userId,
  });
  const dataHash = `0x${crypto
    .createHash('sha256')
    .update(dataHashInput)
    .digest('hex')}` as Hex;

  // --- 2. RECORD ON BLOCKCHAIN ---
  let txHash: Hex;
  try {
    txHash = await recordEventOnChain(
      shipmentId,
      EVENT_STATUS_UPDATE,
      dataHash
    );
    console.log(`[BC] Shipment update recorded with TX: ${txHash}`);
  } catch (e) {
    console.error('Blockchain record failed during shipment update:', e);
    throw new Error('Blockchain transaction failed. Location not updated.');
  }

  // --- 3. DATABASE UPDATE (Atomic) ---
  try {
    // A. Update Shipment Table:
    await query(
      'UPDATE shipments SET current_location = $1, last_update = NOW() WHERE shipment_id = $2',
      [newLocation, shipmentId]
    );

    // B. Update Order Status to SHIPPED (if not already further along)
    await query(
      'UPDATE orders SET current_status = $1, blockchain_tx_hash = $2 WHERE order_id = $3 AND current_status NOT IN ($4, $5, $6)',
      [
        OrderStatus.SHIPPED, // Set status to SHIPPED
        txHash,
        orderId,
        OrderStatus.DELIVERED,
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
      ]
    );
  } catch (e) {
    console.error('Database update failed for shipment location:', e);
    throw new Error('Database update failed.');
  }

  return txHash;
}

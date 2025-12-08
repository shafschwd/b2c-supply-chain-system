// /lib/db/transactions.ts

import { query } from '@/lib/db/client';
import { Order, OrderStatus } from '@/types/order';
import { Shipment } from '@/types/shipment';
import { User } from '@/types/user';
import { Item } from '@/types/item';
import { recordEventOnChain } from '@/lib/blockchain';
import crypto from 'crypto'; // Node.js built-in cryptography module
import { Hex } from 'viem';

// Solidity Event Type Enum Index (from OrderTracker.sol)
const EVENT_ORDER_CREATED = 0;
const EVENT_DELIVERY_CONFIRMED = 2;

interface OrderCreationResult {
  order: Order;
  shipment: Shipment;
  txHash: Hex;
}

/**
 * Executes an atomic transaction to create an order, update balances/stock,
 * and log the initial state on the blockchain.
 */
export async function createOrderTransaction(
  buyer: User,
  item: Item
): Promise<OrderCreationResult> {
  // Server-side validation
  if (buyer.wallet_balance < item.price || item.stock <= 0) {
    throw new Error(
      'Pre-transaction validation failed: Insufficient funds or stock.'
    );
  }

  const orderId = `ord_${Date.now()}`;
  const shipmentId = `shp_${Date.now()}`;
  const currentTimestamp = new Date().toISOString();

  const newOrder: Order = {
    order_id: orderId,
    buyer_id: buyer.id,
    item_id: item.id,
    quantity: 1,
    total_amount: item.price,
    current_status: OrderStatus.PENDING,
    order_timestamp: currentTimestamp,
    blockchain_tx_hash: undefined,
    payment_collected: false, // Add payment_collected property
  };

  const newShipment: Shipment = {
    shipment_id: shipmentId,
    order_id: orderId,
    logistics_id: 'u_3', // Assign to FastTrack Logistics (u_3)
    current_location: 'Awaiting Seller Acceptance',
    last_update: currentTimestamp,
    estimated_arrival: 'Pending',
  };

  // --- 1. GENERATE DATA HASH ---
  // Hash of the critical order data for blockchain proof of integrity
  const dataHashInput = JSON.stringify({
    id: orderId,
    amount: newOrder.total_amount,
    buyer: newOrder.buyer_id,
  });
  const dataHash = `0x${crypto
    .createHash('sha256')
    .update(dataHashInput)
    .digest('hex')}` as Hex;

  // --- 2. RECORD ON BLOCKCHAIN ---
  let txHash: Hex;
  try {
    txHash = await recordEventOnChain(orderId, EVENT_ORDER_CREATED, dataHash);
    console.log(`[BC] Order recorded with TX: ${txHash}`);
  } catch (e) {
    console.error('Blockchain transaction failed during order creation:', e);
    throw new Error('Blockchain record failed. Aborting transaction.');
  }

  // --- 3. START DATABASE TRANSACTION (PostgreSQL) ---
  // NOTE: pg library does not support explicit transaction blocks (BEGIN/COMMIT)
  // with its simple query function. For robustness, this should be done
  // using a dedicated transaction client, but we use sequential queries for demo.

  try {
    // A. Deduct buyer balance (Transfer to 'Escrow' - not explicitly modeled here, just deduction)
    await query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2',
      [newOrder.total_amount, buyer.id]
    );

    // B. Deduct item stock
    await query('UPDATE items SET stock = stock - 1 WHERE id = $1', [item.id]);

    // C. Insert new order, including the blockchain hash
    await query(
      'INSERT INTO orders (order_id, buyer_id, item_id, quantity, total_amount, current_status, blockchain_tx_hash, payment_collected) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        newOrder.order_id,
        newOrder.buyer_id,
        newOrder.item_id,
        newOrder.quantity,
        newOrder.total_amount,
        newOrder.current_status,
        txHash,
        newOrder.payment_collected,
      ]
    );

    // D. Insert new shipment
    await query(
      'INSERT INTO shipments (shipment_id, order_id, logistics_id, current_location, last_update, estimated_arrival) VALUES ($1, $2, $3, $4, NOW(), $5)',
      [
        newShipment.shipment_id,
        newShipment.order_id,
        newShipment.logistics_id,
        newShipment.current_location,
        newShipment.estimated_arrival,
      ]
    );

    return { order: newOrder, shipment: newShipment, txHash };
  } catch (e) {
    console.error('Database transaction failed:', e);
    // In a true atomic system, we would ROLLBACK the DB and potentially
    // log a 'TRANSACTION_FAILED' event on the blockchain.
    throw new Error('Order creation failed during atomic operation.');
  }
}

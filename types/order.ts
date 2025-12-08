// /types/order.ts
import { UserRole } from './user'; // Assuming defined elsewhere

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Order {
  order_id: string; // PK order_id
  buyer_id: string; // FK buyer_id
  item_id: string; // FK item_id
  quantity: number;
  total_amount: number;
  current_status: OrderStatus; // Stored off-chain
  blockchain_tx_hash?: string; // Stored off-chain, linked to on-chain proof
  order_timestamp: string;
  payment_collected?: boolean; // Payment collection flag
}

// /types/order.ts
import { UserRole } from './user'; // Assuming defined elsewhere

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  SHIPPED = 'SHIPPED',
  // IN_TRANSIT is not in DB enum, mapping logical flow to SHIPPED or separating if needed, but keeping simple for now
  DELIVERED = 'DELIVERED',
  CONFIRMED = 'CONFIRMED',
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

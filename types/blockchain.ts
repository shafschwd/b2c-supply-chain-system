// /types/blockchain.ts

export interface BlockchainRecord {
  tx_hash: string;
  block_timestamp: number;
  event_type:
    | 'ORDER_CREATED'
    | 'STATUS_UPDATE'
    | 'DELIVERY_CONFIRMED'
    | 'PAYMENT_RELEASED';
  data_hash: string; // Hash of the off-chain data (e.g., order or shipment metadata)
  sender_address: string;
}

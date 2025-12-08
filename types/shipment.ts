// /types/shipment.ts
export interface Shipment {
  shipment_id: string; // PK shipment_id
  order_id: string; // FK order_id
  logistics_id: string | null; // FK logistics_id
  current_location: string;
  last_update: string;
  estimated_arrival: string;
}

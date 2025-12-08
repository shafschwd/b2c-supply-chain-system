// /types/item.ts

export interface Item {
  id: string; // Corresponds to PK item_id
  seller_id: string; // Corresponds to FK seller_id
  item_name: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
  created_at: string;
}

// /lib/db/items.ts (Server-side PostgreSQL interaction)

import { query } from '@/lib/db/client';
import { Item } from '@/types/item';

// Reads all items for a specific seller
export async function getItemsBySeller(sellerId: string): Promise<Item[]> {
  console.log(`[DB] Fetching items for seller: ${sellerId}`);
  try {
    const result = await query('SELECT * FROM items WHERE seller_id = $1', [
      sellerId,
    ]);
    return result.rows as Item[];
  } catch (error) {
    console.error('Database query error (getItemsBySeller):', error);
    return [];
  }
}

// === NEW: Reads all items (for the Buyer's view or Public catalog) ===
export async function getAllItems(): Promise<Item[]> {
  console.log('[DB] Fetching ALL items for public view.');
  try {
    const result = await query(
      'SELECT * FROM items ORDER BY created_at DESC',
      []
    );
    return result.rows as Item[];
  } catch (error) {
    console.error('Database query error (getAllItems):', error);
    return [];
  }
}

// === MODIFIED: Creates a new item (INSERT) ===
export async function createItem(item: Item): Promise<Item> {
  console.log(`[DB] Creating new item: ${item.item_name}`);
  try {
    const sql = `
      INSERT INTO items (
        id, seller_id, item_name, description, price, stock, image_url, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;
    const params = [
      item.id,
      item.seller_id,
      item.item_name,
      item.description,
      item.price,
      item.stock,
      item.image_url,
    ];

    const result = await query(sql, params);

    // NOTE: After a successful DB insert, you would typically call a blockchain function:
    // await logItemCreationOnChain(item.id, hashOfItemMetadata);

    if (result.rows.length === 0) {
      throw new Error('Failed to create item, database returned no rows.');
    }
    return result.rows[0] as Item;
  } catch (error) {
    console.error('Database query error (createItem):', error);
    throw error;
  }
}

// === MODIFIED: Updates an existing item (UPDATE) ===
export async function updateItem(item: Item): Promise<Item> {
  console.log(`[DB] Updating item: ${item.id}`);
  try {
    const sql = `
      UPDATE items
      SET
        item_name = $1,
        description = $2,
        price = $3,
        stock = $4,
        image_url = $5
      WHERE
        id = $6
      RETURNING *;
    `;
    const params = [
      item.item_name,
      item.description,
      item.price,
      item.stock,
      item.image_url,
      item.id, // WHERE clause parameter
    ];

    const result = await query(sql, params);

    // NOTE: You might log a status update to the blockchain if the update is critical (e.g., stock running out).

    if (result.rows.length === 0) {
      throw new Error('Failed to update item, item ID not found.');
    }
    return result.rows[0] as Item;
  } catch (error) {
    console.error('Database query error (updateItem):', error);
    throw error;
  }
}

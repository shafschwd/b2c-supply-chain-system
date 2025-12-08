// /app/api/inventory/route.ts

import { NextRequest, NextResponse } from 'next/server';
// Import the new function
import {
  getItemsBySeller,
  createItem,
  updateItem,
  getAllItems,
} from '@/lib/db/items';
import { Item } from '@/types/item';
import { User } from '@/types/user';

// === GET (Read Inventory) ===
export async function GET(req: NextRequest) {
  const sellerId = req.nextUrl.searchParams.get('sellerId');

  let items: Item[];

  if (sellerId) {
    // Used by a SELLER for their inventory dashboard
    items = await getItemsBySeller(sellerId);
  } else {
    // Used by a BUYER (or public) for the general catalog
    items = await getAllItems();
  }

  return NextResponse.json(items);
}

// === POST (Create New Item) ===
export async function POST(req: NextRequest) {
  const itemData = (await req.json()) as Omit<Item, 'id' | 'created_at'> & {
    seller_id: string;
  };

  // Generate necessary fields (in a real system, ID generation and seller check are crucial)
  const newItem: Item = {
    id: `i_${Date.now()}`,
    created_at: new Date().toISOString(),
    ...itemData,
    price: Number(itemData.price),
    stock: Number(itemData.stock),
  };

  const createdItem = await createItem(newItem);
  return NextResponse.json(createdItem, { status: 201 });
}

// === PUT (Update Existing Item) ===
export async function PUT(req: NextRequest) {
  const updatedItem = (await req.json()) as Item;

  // Basic validation
  if (!updatedItem.id) {
    return NextResponse.json(
      { error: 'Item ID is required for update' },
      { status: 400 }
    );
  }

  const result = await updateItem(updatedItem);
  return NextResponse.json(result);
}

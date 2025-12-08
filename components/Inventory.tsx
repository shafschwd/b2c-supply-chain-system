// /components/Inventory.tsx

'use client'; // Must be a client component

import React, { useEffect, useState } from 'react';
// 1. UPDATED IMPORTS (Using absolute paths to /types)
import { Item } from '@/types/item';
import { User } from '@/types/user';
import { Plus, Loader2, Edit, Save, X } from 'lucide-react';

// 2. INTERFACE DEFINITION (From your original code)
interface InventoryProps {
  user: User;
}

export const Inventory: React.FC<InventoryProps> = ({ user }) => {
  // 3. STATE DEFINITIONS (From your original code)
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // For Create
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    desc: '',
    stock: '',
  });

  // For Edit
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<Partial<Item>>({});

  // 4. REFRACTORED DATA FETCHING LOGIC (Using API Route)
  const fetchItems = async () => {
    setLoading(true);
    // Fetch data from the Next.js API Route
    const response = await fetch(`/api/inventory?sellerId=${user.id}`);
    if (response.ok) {
      const data: Item[] = await response.json();
      setItems(data);
    } else {
      console.error('Failed to fetch inventory.');
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [user.id]);

  // 5. REFRACTORED CREATE LOGIC (Using API Route)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      seller_id: user.id,
      item_name: newItem.name,
      description: newItem.desc,
      price: Number(newItem.price), // Convert to number for payload
      stock: Number(newItem.stock), // Convert to number for payload
      image_url: `https://picsum.photos/400/300?random=${Date.now()}`,
    };

    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setNewItem({ name: '', price: '', desc: '', stock: '' });
      setShowForm(false);
      fetchItems();
    } else {
      console.error('Failed to create item.');
      setLoading(false);
    }
  };

  // 6. ORIGINAL HELPER FUNCTIONS
  const startEdit = (item: Item) => {
    setEditingItemId(item.id);
    setEditItemData({ ...item });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditItemData({});
  };

  // 7. REFRACTORED UPDATE LOGIC (Using API Route)
  const handleUpdateSubmit = async () => {
    if (!editingItemId || !editItemData) return;

    setLoading(true);
    const original = items.find((i) => i.id === editingItemId);
    if (!original) {
      setLoading(false);
      return;
    }

    const updated: Item = {
      ...original,
      ...editItemData,
      price: Number(editItemData.price),
      stock: Number(editItemData.stock),
      id: editingItemId,
    };

    const response = await fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (response.ok) {
      setEditingItemId(null);
      fetchItems();
    } else {
      console.error('Failed to update item.');
      setLoading(false);
    }
  };

  if (loading && !items.length)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );

  // 8. ORIGINAL JSX RENDER BLOCK
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">My Inventory</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          <span>Add Item</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
          <h3 className="font-bold mb-4">Add New Product</h3>
          <form
            onSubmit={handleCreateSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              required
              placeholder="Item Name"
              className="border p-2 rounded"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <input
              required
              placeholder="Price ($)"
              type="number"
              className="border p-2 rounded"
              value={newItem.price}
              onChange={(e) =>
                setNewItem({ ...newItem, price: e.target.value })
              }
            />
            <input
              required
              placeholder="Stock"
              type="number"
              className="border p-2 rounded"
              value={newItem.stock}
              onChange={(e) =>
                setNewItem({ ...newItem, stock: e.target.value })
              }
            />
            <textarea
              required
              placeholder="Description"
              className="border p-2 rounded md:col-span-2"
              value={newItem.desc}
              onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })}
            />
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-slate-900 text-white px-6 py-2 rounded hover:bg-slate-800"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4 w-32">Price</th>
              <th className="p-4 w-32">Stock</th>
              <th className="p-4">Created At</th>
              <th className="p-4 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="p-4">
                  {editingItemId === item.id ? (
                    <div className="space-y-2">
                      <input
                        className="border p-1 rounded w-full"
                        value={editItemData.item_name}
                        onChange={(e) =>
                          setEditItemData({
                            ...editItemData,
                            item_name: e.target.value,
                          })
                        }
                      />
                      <textarea
                        className="border p-1 rounded w-full text-xs"
                        value={editItemData.description}
                        onChange={(e) =>
                          setEditItemData({
                            ...editItemData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-slate-900">
                        {item.item_name}
                      </div>
                      <div className="text-slate-500 text-xs truncate max-w-xs">
                        {item.description}
                      </div>
                    </div>
                  )}
                </td>
                <td className="p-4">
                  {editingItemId === item.id ? (
                    <input
                      type="number"
                      className="border p-1 rounded w-20"
                      value={editItemData.price}
                      onChange={(e) =>
                        setEditItemData({
                          ...editItemData,
                          price: Number(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <span>${item.price}</span>
                  )}
                </td>
                <td className="p-4">
                  {editingItemId === item.id ? (
                    <input
                      type="number"
                      className="border p-1 rounded w-20"
                      value={editItemData.stock}
                      onChange={(e) =>
                        setEditItemData({
                          ...editItemData,
                          stock: Number(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <span
                      className={
                        item.stock === 0 ? 'text-red-500 font-bold' : ''
                      }
                    >
                      {item.stock} units
                    </span>
                  )}
                </td>
                <td className="p-4 text-slate-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {editingItemId === item.id ? (
                    <div className="flex space-x-1">
                      <button
                        onClick={handleUpdateSubmit}
                        className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No items in inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

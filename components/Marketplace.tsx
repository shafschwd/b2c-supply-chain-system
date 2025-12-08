// /components/Marketplace.tsx

'use client'; // Must be a client component

import React, { useEffect, useState } from 'react';
import { Item } from '@/types/item'; // UPDATED IMPORT
import { User } from '@/types/user'; // UPDATED IMPORT
// Import necessary types that were created in Step 1
// import { OrderStatus } from '@/types/order'; // (Not strictly needed here but good practice)
import { ShoppingBag, Loader2, Wallet, AlertCircle } from 'lucide-react';

interface MarketplaceProps {
  user: User;
  refreshUser: () => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  user,
  refreshUser,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  // REFACTORED: Load items from the inventory API endpoint
  const loadItems = async () => {
    setLoading(true);
    // Note: We use the inventory endpoint to fetch all items available for sale
    try {
      const response = await fetch(`/api/inventory`);
      if (response.ok) {
        const data: Item[] = await response.json();
        setItems(data);
      } else {
        console.error('Failed to load marketplace items.');
        setItems([]);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setItems([]);
    }
    setLoading(false);
  };

  // REFACTORED: Handle Buy uses the new order API route
  const handleBuy = async (item: Item) => {
    if (user.wallet_balance < item.price) {
      alert('Insufficient wallet balance!');
      return;
    }

    setPurchasing(item.id);

    try {
      // Send necessary data to the server API route
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer: user, item: item }),
      });

      const result = await response.json();

      if (response.ok) {
        // 4. Update UI state
        refreshUser(); // Updates the user's wallet balance display
        loadItems(); // Updates the item stock display
        alert(`Order Placed! Blockchain TX: ${result.txHash}`);
      } else {
        // Handle server-side validation errors (e.g., stock ran out just before purchase)
        alert(`Transaction Failed: ${result.error}`);
      }
    } catch (e: any) {
      alert(`An unexpected error occurred: ${e.message}`);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );

  // ... (rest of the component JSX remains the same, using the refactored handleBuy)
  return (
    <div>
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Available Products
        </h2>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <Wallet className="text-blue-600" size={20} />
          <div>
            <span className="text-xs text-slate-500 block uppercase">
              My Balance
            </span>
            <span className="font-bold text-slate-900">
              ${user.wallet_balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const isOutOfStock = item.stock <= 0;
          const canAfford = user.wallet_balance >= item.price;

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="h-48 bg-slate-200 relative">
                <img
                  src={item.image_url}
                  alt={item.item_name}
                  className={`w-full h-full object-cover ${
                    isOutOfStock ? 'grayscale opacity-75' : ''
                  }`}
                />
                <div
                  className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                    isOutOfStock
                      ? 'bg-red-500 text-white'
                      : 'bg-white/90 text-slate-700'
                  }`}
                >
                  {isOutOfStock ? 'Out of Stock' : `Stock: ${item.stock}`}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-900">
                    {item.item_name}
                  </h3>
                  <span className="text-lg font-bold text-blue-600">
                    ${item.price}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>

                {!canAfford && !isOutOfStock && (
                  <div className="flex items-center text-xs text-red-500 mb-2">
                    <AlertCircle size={12} className="mr-1" /> Insufficient
                    Funds
                  </div>
                )}

                <button
                  onClick={() => handleBuy(item)}
                  disabled={!!purchasing || isOutOfStock || !canAfford}
                  className={`w-full font-medium py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 
                    ${
                      isOutOfStock || !canAfford
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {purchasing === item.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>{isOutOfStock ? 'Sold Out' : 'Purchase Now'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

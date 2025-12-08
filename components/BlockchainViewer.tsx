// /components/BlockchainViewer.tsx

'use client'; // Must be a client component for using useState, useEffect, and fetch

import React, { useState, useEffect } from 'react';
import { BlockchainRecord } from '@/types/blockchain'; // Assuming this type is defined in your /types directory
import { ShieldCheck, Clock, FileKey, Link } from 'lucide-react';

/**
 * Fetches the blockchain ledger data from the Next.js API route.
 */
const fetchLedger = async (): Promise<BlockchainRecord[]> => {
  // Client-side fetch call to the secure Next.js API Route handler
  const response = await fetch('/api/blockchain');
  if (!response.ok) {
    // If the API route fails (e.g., Hardhat node is down), throw an error
    throw new Error('Failed to fetch blockchain ledger from API.');
  }
  return response.json();
};

export const BlockchainViewer: React.FC = () => {
  const [ledger, setLedger] = useState<BlockchainRecord[]>([]);

  useEffect(() => {
    // Function to handle fetching and setting the ledger
    const updateLedger = async () => {
      try {
        const data = await fetchLedger();
        // Reverse to show newest transactions first
        setLedger([...data].reverse());
      } catch (error) {
        // Handle errors gracefully without crashing the UI
        console.error('Client failed to fetch ledger:', error);
        // You could also set a dedicated error state here to show a user-friendly message
      }
    };

    // Poll for ledger updates (calls the API route every 2 seconds)
    const interval = setInterval(updateLedger, 2000);

    // Initial fetch
    updateLedger();

    // Cleanup function to stop polling when the component unmounts
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this runs once on mount

  // JSX Content (The UI of the component)
  return (
    <div className="bg-slate-900 text-slate-300 rounded-xl overflow-hidden shadow-2xl border border-slate-700 mt-8">
      <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="text-green-400" size={20} />
          <h3 className="font-mono text-white font-bold">
            Hardhat Local Node - Event Stream
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>Live</span>
        </div>
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3 font-mono text-sm bg-black/20">
        {ledger.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            No transactions recorded on chain yet.
          </div>
        ) : (
          ledger.map((record) => (
            <div
              key={record.tx_hash}
              className="bg-slate-800/50 p-3 rounded border border-slate-700 hover:border-blue-500/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-2 py-0.5 text-xs rounded font-bold ${
                    record.event_type === 'ORDER_CREATED'
                      ? 'bg-blue-900 text-blue-300'
                      : record.event_type === 'STATUS_UPDATE'
                      ? 'bg-yellow-900 text-yellow-300'
                      : 'bg-green-900 text-green-300'
                  }`}
                >
                  {record.event_type}
                </span>
                <span className="flex items-center text-xs text-slate-500">
                  <Clock size={12} className="mr-1" />
                  {new Date(record.block_timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                <div className="flex items-center text-slate-500">
                  <Link size={12} className="mr-1" /> TX Hash:
                </div>
                <div className="text-blue-400 truncate">{record.tx_hash}</div>

                <div className="flex items-center text-slate-500">
                  <FileKey size={12} className="mr-1" /> Data Hash:
                </div>
                <div className="text-orange-300 truncate">
                  {record.data_hash}
                </div>

                <div className="flex items-center text-slate-500">From:</div>
                <div className="text-slate-400 truncate">
                  {record.sender_address}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

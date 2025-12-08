// /components/ShipmentManager.tsx

'use client'; // Must be a client component

import React, { useEffect, useState } from 'react';
import { Shipment } from '@/types/shipment'; // Use absolute imports
import { User } from '@/types/user';
import { OrderStatus, Order } from '@/types/order';
import {
  Truck,
  MapPin,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface ShipmentManagerProps {
  user: User;
}

const LOCATION_FLOW = [
  'Logistics Hub - Kuala Lumpur',
  'Transit Center - Johor Bahru',
  'Delivery Station - Penang',
  'Out for Delivery',
];

export const ShipmentManager: React.FC<ShipmentManagerProps> = ({ user }) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    // Fetch data from the API endpoint
    const response = await fetch(`/api/shipments`);

    if (response.ok) {
      const data = await response.json();
      setShipments(data.shipments);
      setOrders(data.orders);
    } else {
      console.error('Failed to fetch shipment data.');
      setShipments([]);
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user.id]); // Dependency on user.id to potentially refetch if the user changes

  const handleUpdateLocation = async (
    shipment: Shipment,
    newLocation: string
  ) => {
    setUpdating(shipment.shipment_id);

    // Find the associated order to get the order ID needed for the transaction
    const order = orders.find((o) => o.order_id === shipment.order_id);
    if (!order) {
      alert('Error: Associated order not found.');
      setUpdating(null);
      return;
    }

    try {
      const response = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: shipment.shipment_id,
          newLocation: newLocation,
          userId: user.id,
          orderId: order.order_id, // Pass orderId for the status update logic
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          `Location updated to ${newLocation}. Blockchain TX: ${result.txHash}`
        );
      } else {
        alert(`Update Failed: ${result.error}`);
      }
    } catch (e: any) {
      alert(`An unexpected error occurred: ${e.message}`);
    } finally {
      setUpdating(null);
      fetchData(); // Refresh list after update
    }
  };

  const getFlowIndex = (location: string) => {
    return LOCATION_FLOW.indexOf(location);
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );

  const inProcessCount = shipments.filter(
    (s) => s.current_location !== 'Out for Delivery'
  ).length;
  const completedCount = shipments.filter(
    (s) => s.current_location === 'Out for Delivery'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Shipment Management
          </h2>
          <div className="flex space-x-4 mt-2 text-sm">
            <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <Clock size={14} className="mr-1" /> In-Process:{' '}
              <b>{inProcessCount}</b>
            </span>
            <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded">
              <CheckCircle2 size={14} className="mr-1" /> Completed/Out:{' '}
              <b>{completedCount}</b>
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {shipments.map((shipment) => {
          const currentIndex = getFlowIndex(shipment.current_location);
          const isFinalStage = shipment.current_location === 'Out for Delivery';

          // Find associated order to check status
          const order = orders.find((o) => o.order_id === shipment.order_id);
          const isOrderPending =
            order?.current_status === OrderStatus.PENDING ||
            order?.current_status === OrderStatus.PROCESSING; // Ensure shipment only moves if processing

          return (
            <div
              key={shipment.shipment_id}
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Truck
                    className={
                      isFinalStage ? 'text-green-600' : 'text-blue-600'
                    }
                    size={20}
                  />
                  <span className="font-mono text-sm font-bold text-slate-500">
                    ID: {shipment.shipment_id}
                  </span>
                  {isOrderPending && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-red-200">
                      Seller Approval Pending
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-slate-800 font-medium mb-1">
                  <MapPin size={16} />
                  <span>{shipment.current_location}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Last Update: {new Date(shipment.last_update).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Update Checkpoint
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    className="border border-slate-300 rounded px-3 py-2 text-sm bg-slate-50 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                    onChange={(e) =>
                      handleUpdateLocation(shipment, e.target.value)
                    }
                    disabled={!!updating || isFinalStage || isOrderPending}
                    value={shipment.current_location}
                  >
                    {LOCATION_FLOW.map((loc, idx) => (
                      <option
                        key={loc}
                        value={loc}
                        disabled={idx <= currentIndex} // Enforce one-way flow
                      >
                        {loc}
                      </option>
                    ))}
                  </select>
                  {updating === shipment.shipment_id && (
                    <Loader2 className="animate-spin text-blue-600" />
                  )}
                </div>

                {isOrderPending && (
                  <div className="flex items-center text-red-500 text-xs mt-1">
                    <AlertTriangle size={12} className="mr-1" />
                    <span>Waiting for Seller Acceptance</span>
                  </div>
                )}
                {isFinalStage && (
                  <span className="text-xs text-green-600 font-medium">
                    Final Stage Reached
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {shipments.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            No active shipments found.
          </div>
        )}
      </div>
    </div>
  );
};

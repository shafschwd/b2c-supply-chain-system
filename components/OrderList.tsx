// /components/OrderList.tsx

'use client'; // Must be a client component

import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '@/types/order'; // Use absolute imports for types
import { User, UserRole } from '@/types/user';
import { Shipment } from '@/types/shipment';
import {
  Package,
  Check,
  Loader2,
  ExternalLink,
  CheckCircle,
  DollarSign,
  Truck,
} from 'lucide-react';

interface OrderListProps {
  user: User;
  refreshUser?: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({ user, refreshUser }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    // Fetch data from the API endpoint, passing user context
    const response = await fetch(
      `/api/orders?userId=${user.id}&userRole=${user.role}`
    );

    if (response.ok) {
      const data = await response.json();
      setOrders(data.orders);
      setShipments(data.shipments);
    } else {
      console.error('Failed to fetch order list.');
      setOrders([]);
      setShipments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // REFACTORED: Status Update uses the POST API route
  const updateStatus = async (order: Order, status: OrderStatus) => {
    setProcessing(order.order_id);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          orderId: order.order_id,
          newStatus: status,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          `Order status updated to ${status}. Blockchain TX: ${result.txHash}`
        );
      } else {
        alert(`Status Update Failed: ${result.error}`);
      }
    } catch (e: any) {
      alert(`An unexpected error occurred: ${e.message}`);
    } finally {
      setProcessing(null);
      fetchData(); // Refresh list after update
    }
  };

  // REFACTORED: Collect Payment uses the POST API route
  const collectPayment = async (order: Order) => {
    setProcessing(order.order_id);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'collectPayment',
          orderId: order.order_id,
          userId: user.id, // Seller ID
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          `Payment collected successfully! Blockchain TX: ${result.txHash}`
        );
        if (refreshUser) refreshUser(); // Update wallet balance
      } else {
        alert(`Payment Collection Failed: ${result.error}`);
      }
    } catch (e: any) {
      alert(`An unexpected error occurred: ${e.message}`);
    } finally {
      setProcessing(null);
      fetchData(); // Refresh list
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );

  // Calculate Stats for Seller (assuming these props are available in the final Order type)
  // NOTE: You need to ensure 'order.payment_collected' is available on the Order type if not already defined.
  // For now, we will assume it is available.
  const pendingAcceptCount = orders.filter(
    (o) => o.current_status === OrderStatus.PENDING
  ).length;
  const inProcessCount = orders.filter(
    (o) =>
      o.current_status === OrderStatus.PROCESSING ||
      o.current_status === OrderStatus.SHIPPED
  ).length;
  const deliveredCount = orders.filter(
    (o) =>
      o.current_status === OrderStatus.DELIVERED ||
      o.current_status === OrderStatus.COMPLETED
  ).length;
  // const paidCount = orders.filter(o => o.payment_collected).length; // Requires payment_collected field on Order

  // ... (rest of the component JSX remains the same, using the refactored functions)
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">
        {user.role === UserRole.BUYER ? 'My Orders' : 'Order Management'}
      </h2>

      {/* Seller Dashboard Stats */}
      {user.role === UserRole.SELLER && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Pending Accept
            </span>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {pendingAcceptCount}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 shadow-sm">
            <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">
              In-Process
            </span>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {inProcessCount}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">
              Delivered
            </span>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {deliveredCount}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm">
            {/* <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Paid</span>
                <p className="text-3xl font-bold text-slate-800 mt-1">{paidCount}</p> */}
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
              Order Count
            </span>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {orders.length}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          // Find associated shipment to check location
          const shipment = shipments.find((s) => s.order_id === order.order_id);
          const isOutForDelivery =
            shipment?.current_location === 'Out for Delivery';

          return (
            <div
              key={order.order_id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Package className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Order #{order.order_id}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {new Date(order.order_timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        order.current_status === OrderStatus.DELIVERED
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      {order.current_status}
                    </div>
                    {/* Assuming order has payment_collected field */}
                    {(order as any).payment_collected && (
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide border border-green-200 px-2 py-0.5 rounded bg-green-50">
                        Paid
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                  <div>
                    <span className="block text-slate-500 text-xs uppercase">
                      Amount
                    </span>
                    <span className="font-medium">${order.total_amount}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs uppercase">
                      Quantity
                    </span>
                    <span className="font-medium">{order.quantity}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-500 text-xs uppercase">
                      Latest Blockchain Hash
                    </span>
                    <span className="font-mono text-xs text-blue-600 bg-blue-50 p-1 rounded block truncate">
                      {order.blockchain_tx_hash || 'Pending Confirmation...'}
                    </span>
                  </div>
                  {shipment && (
                    <div className="col-span-4 mt-2 bg-slate-50 p-2 rounded flex items-center text-xs text-slate-600">
                      <Truck size={12} className="mr-2" />
                      <span className="font-semibold mr-1">
                        Current Location:
                      </span>{' '}
                      {shipment.current_location}
                    </div>
                  )}
                </div>

                {/* Actions based on Role and Status */}
                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                  {/* Seller Actions */}
                  {user.role === UserRole.SELLER && (
                    <>
                      {order.current_status === OrderStatus.PENDING && (
                        <button
                          onClick={() =>
                            updateStatus(order, OrderStatus.PROCESSING)
                          }
                          disabled={!!processing}
                          className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800"
                        >
                          {processing === order.order_id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <Check size={16} />
                          )}
                          <span>Accept Order</span>
                        </button>
                      )}

                      {/* Requires order.payment_collected field */}
                      {/* We cast to any here to allow for the mock field */}
                      {(order.current_status === OrderStatus.DELIVERED ||
                        order.current_status === OrderStatus.COMPLETED) &&
                        !(order as any).payment_collected && (
                          <button
                            onClick={() => collectPayment(order)}
                            disabled={!!processing}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow-sm"
                          >
                            {processing === order.order_id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <DollarSign size={16} />
                            )}
                            <span>Collect Payment</span>
                          </button>
                        )}
                    </>
                  )}

                  {/* Buyer Actions */}
                  {user.role === UserRole.BUYER &&
                    order.current_status === OrderStatus.SHIPPED && (
                      <>
                        {isOutForDelivery ? (
                          <button
                            onClick={() =>
                              updateStatus(order, OrderStatus.DELIVERED)
                            }
                            disabled={!!processing}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                          >
                            {processing === order.order_id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            <span>Confirm Receipt</span>
                          </button>
                        ) : (
                          <div className="flex items-center space-x-2 text-slate-400 bg-slate-50 px-3 py-2 rounded text-xs select-none">
                            <Truck size={14} />
                            <span>Awaiting Delivery</span>
                          </div>
                        )}
                      </>
                    )}

                  {/* View Hash */}
                  {order.blockchain_tx_hash && (
                    <a
                      href="#"
                      className="flex items-center text-xs text-blue-500 hover:text-blue-700 self-center"
                    >
                      <ExternalLink size={12} className="mr-1" /> View on
                      Etherscan (Sim)
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
};

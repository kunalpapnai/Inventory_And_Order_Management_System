'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { orderService } from '@/services/order.service';
import { formatCurrency, formatDate, getOrderStatusBadge } from '@/utils/formatters';

export const OrderDetailModal = ({ isOpen, onClose, order, onStatusUpdated }) => {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [status, setStatus] = useState(order?.orderStatus || 'Pending');
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync state if order changes
  React.useEffect(() => {
    if (order) {
      setStatus(order.orderStatus);
    }
  }, [order]);

  if (!order) return null;

  const badge = getOrderStatusBadge(order.orderStatus);

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      await orderService.updateOrderStatus(order._id, status);
      toast.success(`Order status updated to '${status}'`);
      onStatusUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Details" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Order Header Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Order ID</span>
            <span className="font-mono text-slate-800 font-bold break-all">
              {order._id}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Customer</span>
            <span className="font-semibold text-slate-900 text-sm">
              {order.customerName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Placed On</span>
            <span className="text-slate-700 font-medium">
              {formatDate(order.createdDate)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Status</span>
            <span
              className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full font-semibold border ${badge.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
              {order.orderStatus}
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
            Order Items Breakdown
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-4">Item</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Price</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/70 border-t border-slate-200 font-semibold text-slate-800">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right text-xs uppercase tracking-wider text-slate-500">
                    Total Amount
                  </td>
                  <td className="py-3 px-4 text-right text-base text-sky-700 font-extrabold">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Creator Note */}
        {order.createdBy && (
          <div className="text-xs text-slate-400">
            Recorded by staff member: <strong>{order.createdBy.name || order.createdBy.email}</strong>
          </div>
        )}

        {/* Admin Order Status Update Section */}
        {isAdmin ? (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3">
            <div className="w-full sm:w-64">
              <Select
                label="Update Fulfillment Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Processing', label: 'Processing' },
                  { value: 'Shipped', label: 'Shipped' },
                  { value: 'Delivered', label: 'Delivered' }
                ]}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose} disabled={isUpdating}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateStatus}
                isLoading={isUpdating}
                disabled={status === order.orderStatus}
              >
                Save Status
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

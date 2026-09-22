'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { orderService } from '@/services/order.service';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import { formatCurrency, formatDate, getOrderStatusBadge } from '@/utils/formatters';

export default function OrdersPage() {
  const { user, isStaff, isAdmin } = useAuth();

  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Selected order for detail modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrders({
        search: search || undefined,
        status: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      });
      setOrders(res.data.orders || []);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, fromDate, toDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Customer Orders
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Monitor and fulfill customer orders across all staff accounts.'
              : 'Create customer orders and track fulfillment progress.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchOrders}
            isLoading={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          {isStaff && (
            <Link href="/orders/new">
              <Button variant="primary" size="sm" icon={Plus}>
                Create Order
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          {/* From Date */}
          <div className="relative">
            <input
              type="date"
              aria-label="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* To Date */}
          <div className="relative">
            <input
              type="date"
              aria-label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {(search || statusFilter || fromDate || toDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {orders.length} of {totalCount} matching orders
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="font-medium text-sky-600 hover:text-sky-700"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={fetchOrders}>
            Retry
          </Button>
        </div>
      )}

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description={
              search || statusFilter || fromDate || toDate
                ? 'No orders match your filter criteria.'
                : 'No orders have been recorded yet.'
            }
            actionLabel={
              search || statusFilter || fromDate || toDate
                ? 'Clear Filters'
                : isStaff
                ? 'Create New Order'
                : undefined
            }
            onAction={
              search || statusFilter || fromDate || toDate
                ? handleResetFilters
                : undefined
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="py-3.5 px-6">Order ID</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Items</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const badge = getOrderStatusBadge(order.orderStatus);
                    return (
                      <tr
                        key={order._id}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => handleViewOrder(order)}
                      >
                        <td className="py-4 px-6 font-mono text-xs text-sky-700 font-bold">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-900">
                          {order.customerName}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-600">
                          {order.items?.length || 0} items
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}
                            />
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500">
                          {formatDate(order.createdDate)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrder(order);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-slate-100">
              {orders.map((order) => {
                const badge = getOrderStatusBadge(order.orderStatus);
                return (
                  <div
                    key={order._id}
                    className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => handleViewOrder(order)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs text-sky-700 font-bold">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {order.customerName}
                        </h4>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>{order.items?.length || 0} item(s)</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                      <span>{formatDate(order.createdDate)}</span>
                      <span className="text-sky-600 font-medium">View details &rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onStatusUpdated={fetchOrders}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { dashboardService } from '@/services/dashboard.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate, getOrderStatusBadge } from '@/utils/formatters';

export default function DashboardPage() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restrict to Admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/products');
    }
  }, [authLoading, isAdmin, router]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getStats();
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time summary of inventory stock levels and customer orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchStats}
            isLoading={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Link href="/products">
            <Button variant="primary" size="sm" icon={Plus}>
              Manage Products
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-850 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-rose-700">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={fetchStats}>
            Retry
          </Button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Products */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Products
                </p>
                {loading ? (
                  <Skeleton className="h-9 w-20 mt-2" />
                ) : (
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                    {stats?.totalProducts ?? 0}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
              <span>In active catalog</span>
            </p>
          </CardContent>
        </Card>

        {/* Low-Stock Products */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Low-Stock Products
                </p>
                {loading ? (
                  <Skeleton className="h-9 w-20 mt-2" />
                ) : (
                  <h3 className="text-3xl font-extrabold text-amber-600 mt-1">
                    {stats?.lowStockProducts ?? 0}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-amber-700 mt-3 font-medium">
              Stock &lt; {stats?.lowStockThreshold ?? 10} units threshold
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Orders
                </p>
                {loading ? (
                  <Skeleton className="h-9 w-20 mt-2" />
                ) : (
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                    {stats?.totalOrders ?? 0}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Lifetime customer orders
            </p>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pending Orders
                </p>
                {loading ? (
                  <Skeleton className="h-9 w-20 mt-2" />
                ) : (
                  <h3 className="text-3xl font-extrabold text-sky-600 mt-1">
                    {stats?.pendingOrders ?? 0}
                  </h3>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-sky-700 mt-3 font-medium">
              Awaiting fulfillment & shipping
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Low Stock Alert & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <CardTitle>Low Stock Alerts</CardTitle>
            </div>
            <Link
              href="/products?stockStatus=lowStock"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !stats?.lowStockItems || stats.lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                All products have healthy stock levels!
              </div>
            ) : (
              stats.lowStockItems.map((item) => (
                <div
                  key={item._id}
                  className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-slate-50/70 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400 font-mono">SKU: {item.SKU}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {item.stockQuantity} in stock
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-sky-500" />
              <CardTitle>Recent Orders</CardTitle>
            </div>
            <Link
              href="/orders"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View all orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No orders have been placed yet.
              </div>
            ) : (
              stats.recentOrders.map((order) => {
                const badge = getOrderStatusBadge(order.orderStatus);
                return (
                  <div
                    key={order._id}
                    className="px-6 py-3.5 flex items-center justify-between text-sm hover:bg-slate-50/70 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(order.createdDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

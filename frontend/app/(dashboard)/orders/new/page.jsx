'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingCart,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Package
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/services/product.service';
import { orderService } from '@/services/order.service';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/utils/formatters';

export default function CreateOrderPage() {
  const router = useRouter();
  const { isStaff, isAdmin } = useAuth();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [orderItems, setOrderItems] = useState([]);

  // Item selector staging state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemError, setItemError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available active products
  useEffect(() => {
    const fetchAvailableProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await productService.getProducts({
          status: 'Active',
          stockStatus: 'inStock'
        });
        setProducts(res.data.products || []);
      } catch (err) {
        toast.error('Failed to load active products for ordering');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchAvailableProducts();
  }, [toast]);

  const selectedProduct = products.find((p) => p._id === selectedProductId) || null;

  // Add item to order
  const handleAddItem = (e) => {
    e.preventDefault();
    setItemError(null);

    if (!selectedProductId) {
      setItemError('Please select a product.');
      return;
    }

    const qty = parseInt(itemQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setItemError('Quantity must be at least 1.');
      return;
    }

    if (!selectedProduct) {
      setItemError('Selected product not found.');
      return;
    }

    // Check against total already in order items
    const existingInCart = orderItems.find((item) => item.productId === selectedProductId);
    const existingQty = existingInCart ? existingInCart.quantity : 0;
    const totalDesiredQty = existingQty + qty;

    if (totalDesiredQty > selectedProduct.stockQuantity) {
      setItemError(
        `Cannot add ${qty} item(s). Available stock is ${selectedProduct.stockQuantity} (already in cart: ${existingQty}).`
      );
      return;
    }

    if (existingInCart) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.productId === selectedProductId
            ? {
                ...item,
                quantity: totalDesiredQty,
                subtotal: Number((item.price * totalDesiredQty).toFixed(2))
              }
            : item
        )
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          productId: selectedProduct._id,
          name: selectedProduct.name,
          SKU: selectedProduct.SKU,
          price: selectedProduct.price,
          quantity: qty,
          maxStock: selectedProduct.stockQuantity,
          subtotal: Number((selectedProduct.price * qty).toFixed(2))
        }
      ]);
    }

    // Reset item selector
    setSelectedProductId('');
    setItemQuantity(1);
  };

  const handleRemoveItem = (productId) => {
    setOrderItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Preview total calculation
  const calculatedTotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Submit order
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error('Customer name is required.');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('Please add at least one product to the order.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        items: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const res = await orderService.createOrder(payload);
      toast.success(`Order created successfully! (Order #${res.data._id.slice(-6).toUpperCase()})`);
      router.push('/orders');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create order';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button and title */}
      <div className="flex items-center gap-3">
        <Link href="/orders">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Back to Orders
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create Customer Order
          </h2>
          <p className="text-xs text-slate-500">
            Select products, verify real-time stock levels, and place customer orders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Product Selection & Customer Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>1. Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                id="customerName"
                name="customerName"
                label="Customer or Company Name"
                required
                placeholder="e.g. Apex Global Industries"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Add Item Card */}
          <Card>
            <CardHeader>
              <CardTitle>2. Select Available Products</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Choose Product <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setItemError(null);
                    }}
                    disabled={loadingProducts}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">
                      {loadingProducts
                        ? 'Loading products...'
                        : '-- Select an active product --'}
                    </option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.SKU}) — {formatCurrency(p.price)} | {p.stockQuantity} in stock
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && (
                  <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-sky-900 space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>Available Stock:</span>
                      <span className="font-bold text-sky-700">
                        {selectedProduct.stockQuantity} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unit Price:</span>
                      <span>{formatCurrency(selectedProduct.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span>{selectedProduct.category}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-3">
                  <div className="w-32">
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedProduct ? selectedProduct.stockQuantity : undefined}
                      label="Quantity"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Button
                      type="submit"
                      variant="secondary"
                      className="w-full"
                      icon={Plus}
                      disabled={!selectedProductId}
                    >
                      Add to Order
                    </Button>
                  </div>
                </div>

                {itemError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {itemError}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary & Confirmation */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="sticky top-20">
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-sky-600" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                  <Package className="w-8 h-8 mx-auto stroke-1" />
                  <p>No products added to order yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                  {orderItems.map((item) => (
                    <div key={item.productId} className="py-3 flex items-start justify-between gap-2 text-xs">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                        <p className="text-slate-400">
                          {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block">
                          {formatCurrency(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-rose-500 hover:text-rose-700 text-[11px] mt-0.5"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Calculation Display */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Items count</span>
                  <span>{orderItems.reduce((sum, i) => sum + i.quantity, 0)} units</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-slate-800">
                  <span>Calculated Total</span>
                  <span className="text-base text-sky-700 font-extrabold">
                    {formatCurrency(calculatedTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 italic">
                  * Order total is strictly verified and processed by the backend.
                </p>
              </div>

              {/* Confirm Order Button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleSubmitOrder}
                isLoading={isSubmitting}
                disabled={orderItems.length === 0 || !customerName.trim()}
                icon={CheckCircle2}
              >
                Confirm & Place Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

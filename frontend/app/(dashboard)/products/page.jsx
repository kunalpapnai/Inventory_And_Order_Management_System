'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  Tag
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/services/product.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { DeleteProductModal } from '@/components/products/DeleteProductModal';
import { formatCurrency, getProductStatusBadge } from '@/utils/formatters';

export default function ProductsPage() {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStock, setSelectedStock] = useState('');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getProducts({
        search: search || undefined,
        category: selectedCategory || undefined,
        status: selectedStatus || undefined,
        stockStatus: selectedStock || undefined
      });
      setProducts(res.data.products || []);
      setCategories(res.data.categories || []);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedStatus, selectedStock]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleCreateNew = () => {
    setEditingProduct(null);
    setFormModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormModalOpen(true);
  };

  const handleDeletePrompt = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSelectedStock('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Product Inventory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Browse and monitor stock quantities, categories, and unit pricing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchProducts}
            isLoading={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleCreateNew}
            >
              Add Product
            </Button>
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
              placeholder="Search by Name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Stock Levels</option>
              <option value="inStock">In Stock (&gt; 0)</option>
              <option value="lowStock">Low Stock (&lt; 10)</option>
              <option value="outOfStock">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {(search || selectedCategory || selectedStatus || selectedStock) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {products.length} of {totalCount} matching products
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
          <Button variant="danger" size="sm" onClick={fetchProducts}>
            Retry
          </Button>
        </div>
      )}

      {/* Table & Cards Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description={
              search || selectedCategory || selectedStatus || selectedStock
                ? 'Try adjusting your search criteria or clearing filters.'
                : 'Your inventory catalog is currently empty.'
            }
            actionLabel={
              search || selectedCategory || selectedStatus || selectedStock
                ? 'Clear Filters'
                : isAdmin
                ? 'Add First Product'
                : undefined
            }
            onAction={
              search || selectedCategory || selectedStatus || selectedStock
                ? handleResetFilters
                : isAdmin
                ? handleCreateNew
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
                    <th className="py-3.5 px-6">Product Name</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Status</th>
                    {isAdmin && <th className="py-3.5 px-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => {
                    const statusBadge = getProductStatusBadge(product.status);
                    const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;
                    const isOutOfStock = product.stockQuantity === 0;

                    return (
                      <tr
                        key={product._id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-600 font-medium">
                          {product.SKU}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {product.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-800">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-800'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {product.stockQuantity} units
                            {isLowStock && ' (Low)'}
                            {isOutOfStock && ' (Out)'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.bg}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}
                            />
                            {product.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                                title="Edit product"
                                aria-label="Edit product"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePrompt(product)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete product"
                                aria-label="Delete product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-Based List Layout */}
            <div className="md:hidden divide-y divide-slate-100">
              {products.map((product) => {
                const statusBadge = getProductStatusBadge(product.status);
                const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;
                const isOutOfStock = product.stockQuantity === 0;

                return (
                  <div key={product._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">
                          {product.name}
                        </h4>
                        <span className="font-mono text-xs text-slate-400">
                          {product.SKU}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.bg}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}
                        />
                        {product.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Category: {product.category}</span>
                      <span className="font-bold text-sm text-slate-800">
                        {formatCurrency(product.price)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-800'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        Stock: {product.stockQuantity}
                        {isLowStock && ' (Low)'}
                        {isOutOfStock && ' (Out)'}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            icon={Edit2}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeletePrompt(product)}
                            icon={Trash2}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Product Form Modal (Add / Edit) */}
      <ProductFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSuccess={fetchProducts}
      />

      {/* Delete Confirmation Modal */}
      <DeleteProductModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        product={productToDelete}
        onSuccess={fetchProducts}
      />
    </div>
  );
}

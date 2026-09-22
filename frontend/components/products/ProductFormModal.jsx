'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { productService } from '@/services/product.service';
import {
  validateRequired,
  validateSKU,
  validateNumber
} from '@/utils/validators';

export const ProductFormModal = ({ isOpen, onClose, product = null, onSuccess }) => {
  const isEditing = !!product;
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    SKU: '',
    category: '',
    price: '',
    stockQuantity: '',
    status: 'Active'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        SKU: product.SKU || '',
        category: product.category || '',
        price: product.price !== undefined ? String(product.price) : '',
        stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : '',
        status: product.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        SKU: '',
        category: '',
        price: '',
        stockQuantity: '',
        status: 'Active'
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Plain JS validation
    const newErrors = {};
    const nameErr = validateRequired(formData.name, 'Product name');
    const skuErr = validateSKU(formData.SKU);
    const catErr = validateRequired(formData.category, 'Category');
    const priceErr = validateNumber(formData.price, 'Price', 0);
    const stockErr = validateNumber(formData.stockQuantity, 'Stock quantity', 0);

    if (nameErr) newErrors.name = nameErr;
    if (skuErr) newErrors.SKU = skuErr;
    if (catErr) newErrors.category = catErr;
    if (priceErr) newErrors.price = priceErr;
    if (stockErr) newErrors.stockQuantity = stockErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await productService.updateProduct(product._id, formData);
        toast.success(`Product '${formData.name}' updated successfully!`);
      } else {
        await productService.createProduct(formData);
        toast.success(`Product '${formData.name}' added to inventory!`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Add New Product'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="name"
          name="name"
          label="Product Name"
          required
          placeholder="e.g. Ergonomic Office Chair"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="SKU"
            name="SKU"
            label="SKU (Stock Keeping Unit)"
            required
            placeholder="e.g. CH-ERG-001"
            value={formData.SKU}
            onChange={handleChange}
            error={errors.SKU}
            helperText="Alphanumeric, hyphens and underscores"
          />

          <Input
            id="category"
            name="category"
            label="Category"
            required
            placeholder="e.g. Furniture"
            value={formData.category}
            onChange={handleChange}
            error={errors.category}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            label="Unit Price ($)"
            required
            placeholder="0.00"
            value={formData.price}
            onChange={handleChange}
            error={errors.price}
          />

          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            label="Initial Stock Quantity"
            required
            placeholder="0"
            value={formData.stockQuantity}
            onChange={handleChange}
            error={errors.stockQuantity}
          />
        </div>

        <Select
          id="status"
          name="status"
          label="Product Status"
          required
          value={formData.status}
          onChange={handleChange}
          options={[
            { value: 'Active', label: 'Active (Available for orders)' },
            { value: 'Inactive', label: 'Inactive (Hidden from ordering)' }
          ]}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

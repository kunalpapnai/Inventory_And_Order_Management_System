'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { productService } from '@/services/product.service';
import { useToast } from '@/components/ui/Toast';

export const DeleteProductModal = ({ isOpen, onClose, product, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  if (!product) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await productService.deleteProduct(product._id);
      toast.success(`Product '${product.name}' was removed from inventory.`);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete product';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Are you sure you want to delete this product?</p>
            <p className="mt-1 text-xs text-rose-700">
              This will permanently remove <strong>{product.name}</strong> ({product.SKU}) from inventory.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
            Delete Product
          </Button>
        </div>
      </div>
    </Modal>
  );
};

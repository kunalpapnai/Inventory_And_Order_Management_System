const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createProductValidator,
  updateProductValidator,
  productIdValidator
} = require('../validators/product.validators');

// Protected for all authenticated users (Admin and Staff can view)
router.get('/', authenticate, productController.getProducts);
router.get('/:id', authenticate, productIdValidator, productController.getProductById);

// Admin-only endpoints
router.post('/', authenticate, authorize('Admin'), createProductValidator, productController.createProduct);
router.put('/:id', authenticate, authorize('Admin'), updateProductValidator, productController.updateProduct);
router.delete('/:id', authenticate, authorize('Admin'), productIdValidator, productController.deleteProduct);

module.exports = router;

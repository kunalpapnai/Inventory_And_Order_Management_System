const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createOrderValidator,
  updateOrderStatusValidator
} = require('../validators/order.validators');

// Authenticated routes
router.get('/', authenticate, orderController.getOrders);
router.get('/:id', authenticate, orderController.getOrderById);

// Staff can create orders
router.post('/', authenticate, authorize('Staff'), createOrderValidator, orderController.createOrder);

// Admin can update status
router.patch('/:id/status', authenticate, authorize('Admin'), updateOrderStatusValidator, orderController.updateOrderStatus);

module.exports = router;

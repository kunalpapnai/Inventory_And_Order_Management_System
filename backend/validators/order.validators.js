const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');

const createOrderValidator = validateRequest([
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('customerId')
    .optional()
    .trim(),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.productId')
    .isMongoId()
    .withMessage('Each item must have a valid productId'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item quantity must be an integer of at least 1')
]);

const updateOrderStatusValidator = validateRequest([
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['Pending', 'Processing', 'Shipped', 'Delivered'])
    .withMessage('Status must be Pending, Processing, Shipped, or Delivered')
]);

module.exports = {
  createOrderValidator,
  updateOrderStatusValidator
};

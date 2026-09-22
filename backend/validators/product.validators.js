const { body, param } = require('express-validator');
const validateRequest = require('./validateRequest');

const createProductValidator = validateRequest([
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required'),
  body('SKU')
    .trim()
    .notEmpty()
    .withMessage('SKU is required')
    .matches(/^[A-Za-z0-9-_]+$/)
    .withMessage('SKU can only contain alphanumeric characters, hyphens, and underscores'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a number greater than or equal to 0'),
  body('stockQuantity')
    .notEmpty()
    .withMessage('Stock quantity is required')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be an integer greater than or equal to 0'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive')
]);

const updateProductValidator = validateRequest([
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty'),
  body('SKU')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('SKU cannot be empty')
    .matches(/^[A-Za-z0-9-_]+$/)
    .withMessage('SKU can only contain alphanumeric characters, hyphens, and underscores'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a number greater than or equal to 0'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be an integer greater than or equal to 0'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive')
]);

const productIdValidator = validateRequest([
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID')
]);

module.exports = {
  createProductValidator,
  updateProductValidator,
  productIdValidator
};

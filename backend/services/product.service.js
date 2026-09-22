const Product = require('../models/Product');
const Order = require('../models/Order');
const config = require('../config/env');

const getProducts = async (queryParams = {}) => {
  const { search, category, status, stockStatus, sort = '-createdAt' } = queryParams;

  const filter = {};

  // Search by name or SKU
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: searchRegex }, { SKU: searchRegex }];
  }

  // Filter by category
  if (category && category.trim() !== '') {
    filter.category = category.trim();
  }

  // Filter by status (Active / Inactive)
  if (status && status.trim() !== '') {
    filter.status = status.trim();
  }

  // Filter by stock status
  if (stockStatus) {
    if (stockStatus === 'inStock') {
      filter.stockQuantity = { $gt: 0 };
    } else if (stockStatus === 'outOfStock') {
      filter.stockQuantity = 0;
    } else if (stockStatus === 'lowStock') {
      filter.stockQuantity = { $gt: 0, $lt: config.lowStockThreshold };
    }
  }

  const products = await Product.find(filter).sort(sort);
  const total = await Product.countDocuments(filter);

  // Get distinct categories for filtering UI
  const categories = await Product.distinct('category');

  return {
    products,
    total,
    categories
  };
};

const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

const createProduct = async (productData) => {
  const existingSku = await Product.findOne({ SKU: productData.SKU.trim().toUpperCase() });
  if (existingSku) {
    const error = new Error(`Product with SKU '${productData.SKU}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const product = await Product.create({
    name: productData.name.trim(),
    SKU: productData.SKU.trim().toUpperCase(),
    category: productData.category.trim(),
    price: Number(productData.price),
    stockQuantity: Number(productData.stockQuantity),
    status: productData.status || 'Active'
  });

  return product;
};

const updateProduct = async (id, updateData) => {
  const product = await Product.findById(id);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  if (updateData.SKU && updateData.SKU.trim().toUpperCase() !== product.SKU) {
    const existingSku = await Product.findOne({
      SKU: updateData.SKU.trim().toUpperCase(),
      _id: { $ne: id }
    });
    if (existingSku) {
      const error = new Error(`Product with SKU '${updateData.SKU}' already exists`);
      error.statusCode = 409;
      throw error;
    }
    product.SKU = updateData.SKU.trim().toUpperCase();
  }

  if (updateData.name !== undefined) product.name = updateData.name.trim();
  if (updateData.category !== undefined) product.category = updateData.category.trim();
  if (updateData.price !== undefined) product.price = Number(updateData.price);
  if (updateData.stockQuantity !== undefined) product.stockQuantity = Number(updateData.stockQuantity);
  if (updateData.status !== undefined) product.status = updateData.status;

  await product.save();
  return product;
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    const error = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  // Prevent deleting product if active orders (Pending or Processing) reference it
  const activeOrder = await Order.findOne({
    'items.productId': id,
    orderStatus: { $in: ['Pending', 'Processing'] }
  });

  if (activeOrder) {
    const error = new Error('Cannot delete product referenced in active orders (Pending or Processing)');
    error.statusCode = 400;
    throw error;
  }

  await Product.findByIdAndDelete(id);
  return { message: 'Product deleted successfully', id };
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

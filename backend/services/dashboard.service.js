const Product = require('../models/Product');
const Order = require('../models/Order');
const config = require('../config/env');

const getDashboardStats = async () => {
  const [totalProducts, lowStockProductsCount, totalOrders, pendingOrdersCount, lowStockItems, recentOrders] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ stockQuantity: { $lt: config.lowStockThreshold } }),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: 'Pending' }),
      Product.find({ stockQuantity: { $lt: config.lowStockThreshold } })
        .sort({ stockQuantity: 1 })
        .limit(5)
        .select('name SKU stockQuantity category price status'),
      Order.find()
        .sort({ createdDate: -1 })
        .limit(5)
        .populate('createdBy', 'name email')
    ]);

  return {
    totalProducts,
    lowStockProducts: lowStockProductsCount,
    totalOrders,
    pendingOrders: pendingOrdersCount,
    lowStockThreshold: config.lowStockThreshold,
    recentOrders,
    lowStockItems
  };
};

module.exports = {
  getDashboardStats
};

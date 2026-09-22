const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const createOrder = async ({ customerName, customerId, items, userId }) => {
  if (!items || !items.length) {
    const error = new Error('Order must contain at least one item');
    error.statusCode = 400;
    throw error;
  }

  // Deduplicate items if same product passed multiple times
  const aggregatedItemsMap = new Map();
  for (const item of items) {
    const qty = parseInt(item.quantity, 10);
    if (!qty || qty <= 0) {
      const error = new Error('Item quantity must be greater than 0');
      error.statusCode = 400;
      throw error;
    }
    const currentQty = aggregatedItemsMap.get(item.productId.toString()) || 0;
    aggregatedItemsMap.set(item.productId.toString(), currentQty + qty);
  }

  // Fetch all products and validate status & stock
  const productIds = Array.from(aggregatedItemsMap.keys());
  const products = await Product.find({ _id: { $in: productIds } });

  if (products.length !== productIds.length) {
    const foundIds = new Set(products.map((p) => p._id.toString()));
    const missingId = productIds.find((id) => !foundIds.has(id));
    const error = new Error(`Product with ID '${missingId}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const processedItems = [];
  let totalAmount = 0;

  // Validation loop
  for (const product of products) {
    const requestedQty = aggregatedItemsMap.get(product._id.toString());

    // Rule: Only active products can be ordered
    if (product.status !== 'Active') {
      const error = new Error(`Product '${product.name}' (${product.SKU}) is inactive and cannot be ordered`);
      error.statusCode = 400;
      throw error;
    }

    // Rule: Stock availability
    if (product.stockQuantity < requestedQty) {
      const error = new Error(
        `Insufficient stock for '${product.name}' (${product.SKU}). Available: ${product.stockQuantity}, Requested: ${requestedQty}`
      );
      error.statusCode = 400;
      throw error;
    }

    // Server-side calculation of price and subtotal
    const price = product.price;
    const subtotal = Number((price * requestedQty).toFixed(2));
    totalAmount += subtotal;

    processedItems.push({
      productId: product._id,
      name: product.name,
      quantity: requestedQty,
      price,
      subtotal
    });
  }

  totalAmount = Number(totalAmount.toFixed(2));

  // Atomic stock reduction for each item
  for (const item of processedItems) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        stockQuantity: { $gte: item.quantity }
      },
      {
        $inc: { stockQuantity: -item.quantity }
      },
      { new: true }
    );

    if (!updated) {
      // Rollback previously decremented products if race condition occurs
      for (const rolledBackItem of processedItems) {
        if (rolledBackItem.productId.toString() === item.productId.toString()) break;
        await Product.findByIdAndUpdate(rolledBackItem.productId, {
          $inc: { stockQuantity: rolledBackItem.quantity }
        });
      }
      const error = new Error(`Concurrency error: insufficient stock during order processing for product ID ${item.productId}`);
      error.statusCode = 409;
      throw error;
    }
  }

  // Create order
  const order = await Order.create({
    customerName: customerName.trim(),
    customerId: customerId ? customerId.trim() : undefined,
    items: processedItems,
    totalAmount,
    orderStatus: 'Pending',
    createdBy: userId
  });

  return order;
};

const getOrders = async ({ user, queryParams = {} }) => {
  const { search, status, fromDate, toDate, sort = '-createdAt' } = queryParams;

  const filter = {};

  // Role authorization: Staff only views their created orders; Admin views all
  if (user.role === 'Staff') {
    filter.createdBy = user._id;
  }

  // Search strictly by customer name only
  if (search && search.trim() !== '') {
    filter.customerName = new RegExp(search.trim(), 'i');
  }

  // Filter by status
  if (status && status.trim() !== '') {
    filter.orderStatus = status.trim();
  }

  // Filter by date range
  if (fromDate || toDate) {
    filter.createdDate = {};
    if (fromDate) {
      filter.createdDate.$gte = new Date(fromDate);
    }
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.createdDate.$lte = endOfDay;
    }
  }

  const orders = await Order.find(filter)
    .populate('createdBy', 'name email role')
    .sort(sort);

  const total = await Order.countDocuments(filter);

  return {
    orders,
    total
  };
};

const getOrderById = async (id, user) => {
  const order = await Order.findById(id).populate('createdBy', 'name email role');
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  // Staff can only view their own order
  if (user.role === 'Staff' && order.createdBy._id.toString() !== user._id.toString()) {
    const error = new Error('Forbidden: You are not authorized to view this order');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

const updateOrderStatus = async (id, newStatus, user) => {
  const order = await Order.findById(id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  if (!validStatuses.includes(newStatus)) {
    const error = new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  order.orderStatus = newStatus;
  await order.save();

  return order;
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};

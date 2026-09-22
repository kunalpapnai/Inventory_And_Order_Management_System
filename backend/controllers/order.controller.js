const orderService = require('../services/order.service');

const createOrder = async (req, res, next) => {
  try {
    const { customerName, customerId, items } = req.body;
    const order = await orderService.createOrder({
      customerName,
      customerId,
      items,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const result = await orderService.getOrders({
      user: req.user,
      queryParams: req.query
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status,
      req.user
    );

    res.status(200).json({
      success: true,
      message: `Order status updated to '${req.body.status}'`,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};

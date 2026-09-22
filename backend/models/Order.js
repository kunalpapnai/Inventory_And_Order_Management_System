const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    }
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    customerId: {
      type: String,
      trim: true
    },
    items: {
      type: [orderItemSchema],
      validate: [
        function (val) {
          return val && val.length > 0;
        },
        'Order must contain at least one item'
      ]
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative']
    },
    orderStatus: {
      type: String,
      enum: {
        values: ['Pending', 'Processing', 'Shipped', 'Delivered'],
        message: 'Order status must be Pending, Processing, Shipped, or Delivered'
      },
      default: 'Pending'
    },
    createdDate: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdBy: 1 });
orderSchema.index({ createdDate: -1 });
orderSchema.index({ customerName: 1 });
orderSchema.index({ customerId: 1 });

module.exports = mongoose.model('Order', orderSchema);

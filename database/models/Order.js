// src/models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String
});

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {  // Added required field
    type: String,
    required: true
  },
  customerPhone: {  // Added required field
    type: String,
    required: true
  },
  items: [orderItemSchema],
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway'],
    required: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  specialInstructions: String,
  discountType: {
    type: String,
    enum: ['none', 'percentage', 'fixed'],
    default: 'none'
  },
  discountValue: {
    type: Number,
    default: 0
  },
  billDetails: {
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    payment: {
      method: String,
      amount: Number,
      timestamp: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;
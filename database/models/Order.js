// database/models/Order.js
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
  notes: String,
  price: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0 // Set a default value
  },
  specialInstructions: String,
  waiter: String,
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway'],
    default: 'dine-in'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }, customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  }, deliveryAddress: {
    type: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      landmark: String
    },
    required: function() {
      return this.orderType === 'delivery';
    }
  },
});

// Add post-save hook to update customer stats
orderSchema.post('save', async function(doc) {
  try {
    const Customer = mongoose.model('Customer');
    await Customer.findByIdAndUpdate(doc.customerId, {
      $inc: {
        totalOrders: 1,
        totalSpent: doc.totalAmount,
        loyaltyPoints: Math.floor(doc.totalAmount) // or your points calculation logic
      },
      $set: {
        lastOrderDate: doc.createdAt
      }
    });
  } catch (error) {
    console.error('Error updating customer stats:', error);
  }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
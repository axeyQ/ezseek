import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  item: {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent mongoose from creating the model multiple times
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
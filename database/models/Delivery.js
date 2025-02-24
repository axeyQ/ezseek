// src/models/Delivery.js
import mongoose from 'mongoose';

// Define the point schema for locations
const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    required: true
  },
  address: String
});

// Define the delivery schema
const deliverySchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'],
    default: 'PENDING'
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rider'
  },
  pickupLocation: pointSchema,
  dropLocation: pointSchema,
  estimatedTime: Number,
  actualDeliveryTime: Date
}, {
  timestamps: true
});

// Add indexes for geospatial queries
deliverySchema.index({ 'pickupLocation': '2dsphere' });
deliverySchema.index({ 'dropLocation': '2dsphere' });

// Check if the model exists before creating a new one
const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);

export default Delivery;
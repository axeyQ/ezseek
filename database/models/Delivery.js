import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  },
  address: String
});

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
  pickupLocation: {
    type: pointSchema,
    required: true
  },
  dropLocation: {
    type: pointSchema,
    required: true
  },
  estimatedTime: Number,
  actualDeliveryTime: Date
}, {
  timestamps: true
});

deliverySchema.index({ 'pickupLocation': '2dsphere' });
deliverySchema.index({ 'dropLocation': '2dsphere' });

const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);
export default Delivery;
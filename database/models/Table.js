// database/models/Rider.js
import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
    default: 'OFFLINE'
  },
  currentDelivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  rating: {
    type: Number,
    default: 0
  },
  deliveriesCompleted: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

riderSchema.index({ currentLocation: '2dsphere' });

const Rider = mongoose.models.Rider || mongoose.model('Rider', riderSchema);
export default Rider;
// src/models/Rider.js
import mongoose from 'mongoose';

const riderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
    default: 'AVAILABLE'
  },
  deliveriesCompleted: {
    type: Number,
    default: 0
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
}, {
  timestamps: true
});

riderSchema.index({ currentLocation: '2dsphere' });

const Rider = mongoose.models.Rider || mongoose.model('Rider', riderSchema);
export default Rider;
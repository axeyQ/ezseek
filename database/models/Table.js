// database/models/Table.js
import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true,
    unique: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  location: {
    type: String,
    enum: ['indoor', 'outdoor', 'balcony'],
    default: 'indoor'
  },
  qrCode: {
    url: String,
    image: String,
    generatedAt: Date,
    lastScanned: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
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

// Pre-save middleware to update timestamps
tableSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Table = mongoose.models.Table || mongoose.model('Table', tableSchema);
export default Table;
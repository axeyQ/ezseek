// database/models/Customer.js
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  street: String,
  city: String,
  state: String,
  zipCode: String,
  landmark: String,
  isDefault: {
    type: Boolean,
    default: false
  }
});

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  addresses: [addressSchema],
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastOrderDate: Date,
  preferences: {
    dietaryRestrictions: [String],
    favoriteItems: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu'
    }],
    preferredPaymentMethod: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps pre-save
customerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save hook to ensure only one default address
customerSchema.pre('save', function(next) {
  if (this.addresses && this.addresses.length > 0) {
    const defaultAddresses = this.addresses.filter(addr => addr.isDefault);
    if (defaultAddresses.length > 1) {
      // Keep only the last default address
      for (let i = 0; i < defaultAddresses.length - 1; i++) {
        defaultAddresses[i].isDefault = false;
      }
    }
  }
  next();
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;
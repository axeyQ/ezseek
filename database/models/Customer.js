// src/models/Customer.js
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  landmark: String,
  isDefault: {
    type: Boolean,
    default: false
  }
});

const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  phone: {  // Changed from contactNumber to phone
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: 'Please enter a valid 10-digit phone number'
    }
  },
  alternatePhone: {  // Changed from alternateNumber to alternatePhone
    type: String,
    trim: true,
    sparse: true,  // Allows multiple null values
    validate: {
      validator: function(v) {
        return !v || /^\d{10}$/.test(v);
      },
      message: 'Please enter a valid 10-digit phone number'
    }
  },
  addresses: [addressSchema],
  totalOrders: {
    type: Number,
    default: 0
  },
  totalOrdersValue: {
    type: Number,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  lastOrderDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to clean phone numbers
customerSchema.pre('save', function(next) {
  if (this.phone) {
    this.phone = this.phone.replace(/\D/g, '');
  }
  if (this.alternatePhone) {
    this.alternatePhone = this.alternatePhone.replace(/\D/g, '');
  }
  this.updatedAt = new Date();
  next();
});

// Calculate average order value
customerSchema.pre('save', function(next) {
  if (this.totalOrders > 0) {
    this.averageOrderValue = this.totalOrdersValue / this.totalOrders;
  }
  next();
});

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
export default Customer;
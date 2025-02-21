// database/models/Menu.js
import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['appetizer', 'main', 'dessert', 'beverage'],
    default: 'main'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number,
    min: 0
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'hot', 'extra-hot'],
    default: 'mild'
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  allergens: [{
    type: String,
    enum: ['nuts', 'dairy', 'gluten', 'soy', 'eggs', 'shellfish']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
menuSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Menu = mongoose.models.Menu || mongoose.model('Menu', menuSchema);

export default Menu;
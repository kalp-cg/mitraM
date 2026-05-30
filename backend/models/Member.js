const mongoose = require('mongoose');

const yearDataSchema = new mongoose.Schema({
  capital: { type: Number, default: 0 },
  expense: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
}, { _id: false });

const memberSchema = new mongoose.Schema({
  nameEn: {
    type: String,
    required: true
  },
  nameGu: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  },
  imageUrl: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  gopiMandal: {
    type: Number,
    default: 0
  },
  // Dynamically store year data
  years: {
    type: Map,
    of: yearDataSchema,
    default: {}
  }
}, {
  timestamps: true,
  // toJSON: { virtuals: true },
  // toObject: { virtuals: true }
});

// Example of how to add a virtual for a specific year's holding if needed
// memberSchema.virtual('holding2024_25').get(function() {
//   return this.years?.get('year2024_25')?.holding || 0;
// });


module.exports = mongoose.model('Member', memberSchema);

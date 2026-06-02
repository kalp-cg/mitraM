const mongoose = require('mongoose');

const ipoTradeSchema = new mongoose.Schema({
  shareName: {
    type: String,
    required: true
  },
  buyDate: {
    type: Date,
    required: true
  },
  sellDate: {
    type: Date,
    default: null
  },
  buyPrice: {
    type: Number,
    required: true,
    default: 0
  },
  sellPrice: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  dematAccount: {
    type: String,
    default: 'NILAM SBI'
  },
  status: {
    type: String,
    enum: ['holding', 'sold'],
    default: 'holding'
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  year: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Pre-save: auto-calculate profit/loss
ipoTradeSchema.pre('save', function(next) {
  if (this.status === 'sold' && this.sellPrice > 0) {
    this.profitLoss = (this.sellPrice - this.buyPrice) * (this.quantity || 1);
  } else {
    this.profitLoss = 0;
  }
  next();
});

module.exports = mongoose.model('IpoTrade', ipoTradeSchema);

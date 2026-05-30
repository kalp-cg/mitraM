const mongoose = require('mongoose');

const masterSummaryRowSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true 
    // keys: 'aavak', 'bakiKharcha', 'vadheliRakam', 'nafoo', 'holding', 'gopiMandal', 'ekandKul'
  },
  labelGujarati: {
    type: String,
    required: true
  },
  values: {
    type: Map,
    of: Number,
    default: {}
    // { "2023/24": 100000, "2024/25": 150000 }
  },
  total: {
    type: Number,
    default: 0
  }
}, { _id: false });

const yearlyReportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    enum: ['master_summary', 'member_distribution'],
    required: true
  },
  years: [{
    type: String // ["2023/24", "2024/25"]
  }],
  masterSummary: [masterSummaryRowSchema],
  lastUpdatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('YearlyReport', yearlyReportSchema);

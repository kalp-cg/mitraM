const mongoose = require('mongoose');

const appStateSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'main',
    unique: true,
    index: true,
  },
  members: {
    type: Array,
    default: [],
  },
  masterRows: {
    type: Array,
    default: [],
  },
  currentYear: {
    type: String,
    default: 'year2024_25',
  },
  appTitleGu: {
    type: String,
    default: 'શુભ વ્યાપાર',
  },
  appDescriptionGu: {
    type: String,
    default: 'ચોપડા પૂજન ડિજિટલ ખાતાવહી',
  },
  recentLogs: {
    type: Array,
    default: [],
  },
  targetAccounts: {
    type: Array,
    default: ['પિતૃ પક્ષ ખાતું (પિતાજી)', 'માતાજીનું ખાતું', 'પત્નીનું ખાતું', 'મોટા દાદીનું ખાતું'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AppState', appStateSchema);
const mongoose = require('mongoose');

const alertLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['FIRE', 'GAS', 'GATE', 'RFID'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AlertLog', alertLogSchema);

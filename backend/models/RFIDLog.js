const mongoose = require('mongoose');

const rfidLogSchema = new mongoose.Schema({
  card_id: { type: String, required: true },
  status: { type: String, enum: ['Authorized', 'Denied'], required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RFIDLog', rfidLogSchema);

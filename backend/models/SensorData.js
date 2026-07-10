const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  temperature: { type: Number, required: true },
  gas1: { type: Number, required: true },
  gas2: { type: Number, required: true },
  flame1: { type: Number, required: true },
  flame2: { type: Number, required: true },
  gate: { type: Number, required: true },
  system_state: { type: String, enum: ['SAFE', 'WARNING', 'DANGER'], default: 'SAFE' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorData', sensorDataSchema);

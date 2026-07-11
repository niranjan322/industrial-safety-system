const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const SensorData = require('../models/SensorData');
const RFIDLog = require('../models/RFIDLog');
const AlertLog = require('../models/AlertLog');

const router = express.Router();

// Middleware to verify JWT
const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.id;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized' });
    }
  }
  if (!token) res.status(401).json({ message: 'Not authorized, no token' });
};

// ========================
// AUTH ROUTES
// ========================
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, username: user.username });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/auth/setup', async (req, res) => {
  // Simple route to create an initial admin user if none exists
  const userExists = await User.countDocuments();
  if (userExists > 0) return res.status(400).json({ message: 'Admin already exists' });
  
  const user = await User.create({ username: 'admin', password: 'password123' });
  res.status(201).json({ message: 'Admin created', username: user.username });
});

router.post('/auth/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const user = await User.create({ username, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========================
// DATA INGESTION (FROM ESP32)
// ========================
router.post('/sensors/update', async (req, res) => {
  try {
    const { temperature, gas1, gas2, flame1, flame2, gate } = req.body;
    
    let system_state = 'SAFE';
    let alerts = [];

    const fireDetected = (flame1 === 1 && flame2 === 1) ? 1 : 0;
    const gasDetected = (gas1 === 1 || gas2 === 1) ? 1 : 0;

    if (fireDetected) {
      system_state = 'DANGER';
      alerts.push({ type: 'FIRE', message: '🔥 Fire detected in industry' });
    } else if (gasDetected) {
      system_state = 'WARNING';
      alerts.push({ type: 'GAS', message: '⚠ Gas leakage detected' });
    }

    if (gate === 90) { // Emergency gate opened
       alerts.push({ type: 'GATE', message: 'Emergency gate opened' });
    }

    const newData = await SensorData.create({
      temperature, gas1, gas2, flame1, flame2, gate, system_state
    });

    if (alerts.length > 0) {
      for (let alert of alerts) {
        await AlertLog.create(alert);
      }
    }

    // Emit via WebSocket through global io object
    req.app.get('io').emit('sensor_update', newData);
    if (alerts.length > 0) {
      req.app.get('io').emit('new_alerts', alerts);
    }

    res.status(201).json({ success: true, state: system_state });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/logs/rfid', async (req, res) => {
  try {
    const { card_id, status } = req.body;
    const log = await RFIDLog.create({ card_id, status });
    
    req.app.get('io').emit('rfid_update', log);
    
    if (status === 'Denied') {
      const alert = await AlertLog.create({ type: 'RFID', message: `Unauthorized RFID detected: ${card_id}` });
      req.app.get('io').emit('new_alerts', [alert]);
    }
    
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========================
// DASHBOARD DATA ROUTES (PROTECTED)
// ========================
router.get('/sensors/latest', protect, async (req, res) => {
  const latest = await SensorData.findOne().sort({ timestamp: -1 });
  res.json(latest || {});
});

router.get('/sensors/history', protect, async (req, res) => {
  const history = await SensorData.find().sort({ timestamp: -1 }).limit(100);
  res.json(history.reverse());
});

router.get('/logs/rfid', protect, async (req, res) => {
  const logs = await RFIDLog.find().sort({ timestamp: -1 }).limit(50);
  res.json(logs);
});

router.get('/logs/alerts', protect, async (req, res) => {
  const alerts = await AlertLog.find().sort({ timestamp: -1 }).limit(50);
  res.json(alerts);
});

module.exports = router;

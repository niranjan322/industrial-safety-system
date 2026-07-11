const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For dev; restrict in prod
    methods: ['GET', 'POST']
  }
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Serve Frontend Static Files
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('Client connected to WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Database and Server Init
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('✅ MongoDB Connected Successfully');
    })
    .catch(err => {
      console.error('\n=======================================');
      console.error('🚨 MONGODB CONNECTION ERROR 🚨');
      console.error('Your server is running, but the database failed to connect.');
      console.error('Please check your MONGO_URI in Render Environment Variables.');
      console.error('');
      console.error('Common issues:');
      console.error('1. You forgot to replace <password> with your real password.');
      console.error('2. You left the < > brackets around the password.');
      console.error('3. Network Access (IP Whitelist) is not set to 0.0.0.0/0 in MongoDB Atlas.');
      console.error('');
      console.error('Exact Error message from MongoDB:');
      console.error(err.message);
      console.error('=======================================\n');
    });
});

const mongoose = require('mongoose');

let isConnected = false;

const connect = async () => {
  if (isConnected) {
    console.log('⚡️ Using existing MongoDB connection');
    return;
  }
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
};

module.exports = connect;

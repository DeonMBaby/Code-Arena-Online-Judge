const mongoose = require('mongoose');

const PLACEHOLDER_MARKERS = ['YOUR_DB_USERNAME', 'YOUR_DB_PASSWORD', 'YOUR_CLUSTER_URL'];

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || PLACEHOLDER_MARKERS.some((marker) => mongoUri.includes(marker))) {
    console.error('Invalid MONGO_URI in backend/.env. Replace the placeholder MongoDB URI with a real connection string.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;

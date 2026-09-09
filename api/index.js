import { createApp } from '../backend/src/app.js';
import mongoose from 'mongoose';

// Ensure MongoDB is connected
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI is not set!");
    return;
  }

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected for serverless function');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

const app = createApp();

// Add a middleware to ensure DB connection before handling API routes
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

export default app;

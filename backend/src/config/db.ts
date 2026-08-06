import mongoose from 'mongoose';
import dns from 'dns';

// Connects to MongoDB database with graceful logging
export const connectDB = async (): Promise<void> => {
  try {
    // Override default local DNS resolver with Google Public DNS for reliable SRV record resolution
    dns.setServers(['8.8.8.8', '8.8.4.4']);

    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/standup_ai';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    // Exit process with failure code if unable to establish database connection
    process.exit(1);
  }
};

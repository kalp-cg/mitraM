const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mitram';
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // In non-production (development or test) continue without DB to allow tests/local runs
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️  Running without database in non-production mode');
      return null;
    }
    process.exit(1);
  }
};

module.exports = connectDB;

const mongoose = require('mongoose');
require('dotenv').config();

console.log('=== Environment Variables Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
console.log('MONGODB_URI starts with:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'undefined');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('RAILWAY_URL:', process.env.RAILWAY_URL);

if (!process.env.MONGODB_URI) {
  console.error('\n❌ MONGODB_URI is not set!');
  console.log('Please set it in Railway environment variables:');
  console.log('MongoDB URI is set:', process.env.MONGODB_URI ? 'YES' : 'NO');
  process.exit(1);
}

// Test MongoDB connection
console.log('\n=== Testing MongoDB Connection ===');
const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connection successful!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();

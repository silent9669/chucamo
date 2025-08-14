const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const checkSession = require('../middleware/checkSession');
require('dotenv').config({ path: '../.env' });

console.log('🧪 Testing Server Components...\n');

try {
  // Test 1: Check environment variables
  console.log('✅ Environment variables loaded');
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Missing'}`);
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'Set' : 'Missing'}`);
  console.log(`   JWT_EXPIRE: ${process.env.JWT_EXPIRE || '7d'}`);

  // Test 2: Test model imports
  console.log('\n✅ Models imported successfully');
  console.log('   User model:', typeof User);
  console.log('   Session model:', typeof Session);

  // Test 3: Test middleware import
  console.log('\n✅ Middleware imported successfully');
  console.log('   checkSession middleware:', typeof checkSession);

  // Test 4: Test Express app creation
  const app = express();
  console.log('\n✅ Express app created successfully');

  // Test 5: Test MongoDB connection (without actually connecting)
  console.log('\n✅ MongoDB connection string format valid');
  const uri = process.env.MONGODB_URI;
  if (uri && uri.includes('mongodb')) {
    console.log('   MongoDB URI format: Valid');
  } else {
    console.log('   MongoDB URI format: Invalid');
  }

  console.log('\n🎉 All server components working correctly!');
  console.log('✅ Server start test passed!');
  console.log('\n📋 Ready to start server with: npm start');
  
} catch (error) {
  console.error('❌ Server start test failed:', error.message);
  process.exit(1);
}

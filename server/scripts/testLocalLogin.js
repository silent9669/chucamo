const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const testLocalLogin = async () => {
  try {
    // Connect to local MongoDB
    const localMongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bluebook-sat-simulator';
    console.log('🔗 Connecting to local MongoDB...');
    console.log('📍 URI:', localMongoURI);
    
    await mongoose.connect(localMongoURI);
    console.log('✅ Connected to local MongoDB successfully!');

    // Check if admin users exist
    const adminUsers = await User.find({ role: 'admin' }).select('+password');
    console.log(`\n📊 Found ${adminUsers.length} admin users:`);
    
    adminUsers.forEach((user, index) => {
      console.log(`\n👤 Admin ${index + 1}:`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password field exists: ${!!user.password}`);
      console.log(`   Password length: ${user.password ? user.password.length : 0}`);
    });

    // Test login with localadmin
    console.log('\n🧪 Testing login with localadmin...');
    const localAdmin = await User.findOne({ username: 'localadmin' }).select('+password');
    
    if (!localAdmin) {
      console.log('❌ localadmin user not found!');
      return;
    }

    console.log('✅ localadmin user found');
    console.log('🔍 Testing password: admin123');
    
    const isMatch = await localAdmin.comparePassword('admin123');
    console.log('✅ Password match:', isMatch);

    if (!isMatch) {
      console.log('❌ Password does not match!');
      console.log('🔍 Let\'s try to reset the password...');
      
      // Reset password
      localAdmin.password = 'admin123';
      await localAdmin.save();
      
      console.log('✅ Password reset to: admin123');
      
      // Test again
      const newMatch = await localAdmin.comparePassword('admin123');
      console.log('✅ New password test:', newMatch);
    }

    // Also test with email
    console.log('\n🧪 Testing login with email...');
    const emailAdmin = await User.findOne({ email: 'localadmin@localhost.com' }).select('+password');
    
    if (emailAdmin) {
      const emailMatch = await emailAdmin.comparePassword('admin123');
      console.log('✅ Email login test:', emailMatch);
    }

    // Test all possible login combinations
    console.log('\n🧪 Testing all possible login combinations...');
    const testCredentials = [
      { username: 'localadmin', password: 'admin123' },
      { email: 'localadmin@localhost.com', password: 'admin123' },
      { username: 'backuplocal', password: 'password123' },
      { email: 'backuplocal@localhost.com', password: 'password123' }
    ];

    for (const cred of testCredentials) {
      let user;
      if (cred.username) {
        user = await User.findOne({ username: cred.username }).select('+password');
      } else if (cred.email) {
        user = await User.findOne({ email: cred.email }).select('+password');
      }
      
      if (user) {
        const match = await user.comparePassword(cred.password);
        console.log(`✅ ${cred.username || cred.email} / ${cred.password}: ${match}`);
      } else {
        console.log(`❌ ${cred.username || cred.email} / ${cred.password}: User not found`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

testLocalLogin();

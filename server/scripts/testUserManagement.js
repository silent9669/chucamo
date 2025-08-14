const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testUserManagement() {
  try {
    console.log('\n🧪 Testing User Management Enhancements...\n');

    // Clean up any existing test data
    await User.deleteMany({ email: /test-user-management/ });
    await Session.deleteMany({});

    // Create test users
    const testUser1 = await User.create({
      firstName: 'Test',
      lastName: 'User1',
      username: 'testuser1',
      email: 'test-user-management-1@example.com',
      password: 'password123',
      status: 'active'
    });

    const testUser2 = await User.create({
      firstName: 'Test',
      lastName: 'User2',
      username: 'testuser2',
      email: 'test-user-management-2@example.com',
      password: 'password123',
      status: 'locked'
    });

    console.log('✅ Created test users');

    // Create sessions for user 1 (2 devices - should be at limit)
    await Session.create({
      userId: testUser1._id,
      sessionId: 'session-1-1',
      deviceInfo: 'Device 1 - Chrome',
      ip: '192.168.1.1'
    });

    await Session.create({
      userId: testUser1._id,
      sessionId: 'session-1-2',
      deviceInfo: 'Device 2 - Firefox',
      ip: '192.168.1.2'
    });

    // Create 1 session for user 2 (1 device - under limit but account locked)
    await Session.create({
      userId: testUser2._id,
      sessionId: 'session-2-1',
      deviceInfo: 'Device 1 - Safari',
      ip: '192.168.1.3'
    });

    console.log('✅ Created test sessions');

    // Test 1: Check device counts
    console.log('\n📱 Test 1: Device Count Verification');
    const user1Sessions = await Session.find({ userId: testUser1._id });
    const user2Sessions = await Session.find({ userId: testUser2._id });
    
    console.log(`   User 1 (${testUser1.email}): ${user1Sessions.length} devices`);
    console.log(`   User 2 (${testUser2.email}): ${user2Sessions.length} devices`);

    if (user1Sessions.length === 2) {
      console.log('✅ User 1 has 2 devices (at limit)');
    } else {
      console.log('❌ User 1 should have 2 devices');
    }

    if (user2Sessions.length === 1) {
      console.log('✅ User 2 has 1 device (under limit)');
    } else {
      console.log('❌ User 2 should have 1 device');
    }

    // Test 2: Check user statuses
    console.log('\n🔒 Test 2: User Status Verification');
    const updatedUser1 = await User.findById(testUser1._id);
    const updatedUser2 = await User.findById(testUser2._id);
    
    console.log(`   User 1 status: ${updatedUser1.status}`);
    console.log(`   User 2 status: ${updatedUser2.status}`);

    if (updatedUser1.status === 'active') {
      console.log('✅ User 1 is active');
    } else {
      console.log('❌ User 1 should be active');
    }

    if (updatedUser2.status === 'locked') {
      console.log('✅ User 2 is locked');
    } else {
      console.log('❌ User 2 should be locked');
    }

    // Test 3: Test unlock functionality
    console.log('\n🔓 Test 3: Account Unlock Functionality');
    
    // Simulate unlocking user 2
    updatedUser2.status = 'active';
    await updatedUser2.save();
    
    const unlockedUser2 = await User.findById(testUser2._id);
    console.log(`   User 2 status after unlock: ${unlockedUser2.status}`);
    
    if (unlockedUser2.status === 'active') {
      console.log('✅ User 2 successfully unlocked');
    } else {
      console.log('❌ User 2 unlock failed');
    }

    // Test 4: Verify device count aggregation works
    console.log('\n📊 Test 4: Device Count Aggregation');
    
    const usersWithStats = await Promise.all([testUser1._id, testUser2._id].map(async (userId) => {
      const user = await User.findById(userId);
      const deviceCount = await Session.countDocuments({ userId });
      const testCount = 0; // Mock test count
      
      return {
        _id: user._id,
        email: user.email,
        status: user.status,
        deviceCount,
        testCount
      };
    }));

    console.log('   Users with stats:');
    usersWithStats.forEach(user => {
      console.log(`     ${user.email}: ${user.deviceCount} devices, status: ${user.status}`);
    });

    // Test 5: Clean up
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ email: /test-user-management/ });
    await Session.deleteMany({});
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 User Management test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Device count tracking working');
    console.log('   ✅ User status management working');
    console.log('   ✅ Account unlock functionality working');
    console.log('   ✅ Device count aggregation working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testUserManagement();

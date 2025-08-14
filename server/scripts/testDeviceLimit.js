const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testDeviceLimit() {
  try {
    console.log('\n🧪 Testing Device Limit Functionality...\n');

    // Clean up any existing test data
    await User.deleteMany({ email: /test-device-limit/ });
    await Session.deleteMany({});

    // Create a test user
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      username: 'testdevicelimit',
      email: 'test-device-limit@example.com',
      password: 'password123',
      status: 'active'
    });

    console.log('✅ Created test user:', testUser.email);

    // Test 1: First login should work
    console.log('\n📱 Test 1: First device login');
    const session1 = await Session.create({
      userId: testUser._id,
      sessionId: 'session-1',
      deviceInfo: 'Device 1 - Chrome',
      ip: '192.168.1.1'
    });
    console.log('✅ First session created');

    // Test 2: Second login should work
    console.log('\n📱 Test 2: Second device login');
    const session2 = await Session.create({
      userId: testUser._id,
      sessionId: 'session-2',
      deviceInfo: 'Device 2 - Firefox',
      ip: '192.168.1.2'
    });
    console.log('✅ Second session created');

    // Test 3: Check active sessions count
    const activeSessions = await Session.find({ userId: testUser._id });
    console.log(`📊 Active sessions: ${activeSessions.length}/2`);

    // Test 4: Third login should lock account
    console.log('\n📱 Test 3: Third device login (should lock account)');
    try {
      const session3 = await Session.create({
        userId: testUser._id,
        sessionId: 'session-3',
        deviceInfo: 'Device 3 - Safari',
        ip: '192.168.1.3'
      });
      console.log('❌ Third session created (this should not happen)');
    } catch (error) {
      console.log('✅ Third session creation blocked');
    }

    // Test 5: Verify account is locked
    const updatedUser = await User.findById(testUser._id);
    console.log(`🔒 User status: ${updatedUser.status}`);

    if (updatedUser.status === 'locked') {
      console.log('✅ Account successfully locked after third device attempt');
    } else {
      console.log('❌ Account should be locked but is not');
    }

    // Test 6: Clean up
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ email: /test-device-limit/ });
    await Session.deleteMany({});
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Device limit test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testDeviceLimit();

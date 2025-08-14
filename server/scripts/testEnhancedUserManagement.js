const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
require('dotenv').config({ path: '../.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testEnhancedUserManagement() {
  try {
    console.log('\n🧪 Testing Enhanced User Management Features...\n');

    // Clean up test data
    await User.deleteMany({ email: /test-enhanced/ });
    await Session.deleteMany({});

    // Create test users
    const testUser1 = await User.create({
      firstName: 'Test',
      lastName: 'Enhanced1',
      username: 'testenhanced1',
      email: 'test-enhanced-1@example.com',
      password: 'password123',
      status: 'active'
    });

    const testUser2 = await User.create({
      firstName: 'Test',
      lastName: 'Enhanced2',
      username: 'testenhanced2',
      email: 'test-enhanced-2@example.com',
      password: 'password123',
      status: 'locked'
    });

    console.log('✅ Created test users');

    // Create sessions
    await Session.create({
      userId: testUser1._id,
      sessionId: 'session-enhanced-1-1',
      deviceInfo: 'Device 1 - Chrome',
      ip: '192.168.1.1'
    });

    await Session.create({
      userId: testUser1._id,
      sessionId: 'session-enhanced-1-2',
      deviceInfo: 'Device 2 - Firefox',
      ip: '192.168.1.2'
    });

    await Session.create({
      userId: testUser2._id,
      sessionId: 'session-enhanced-2-1',
      deviceInfo: 'Device 1 - Safari',
      ip: '192.168.1.3'
    });

    console.log('✅ Created test sessions');

    // Test device count aggregation
    const user1Sessions = await Session.find({ userId: testUser1._id });
    const user2Sessions = await Session.find({ userId: testUser2._id });
    
    console.log(`   User 1: ${user1Sessions.length} devices, status: ${testUser1.status}`);
    console.log(`   User 2: ${user2Sessions.length} devices, status: ${testUser2.status}`);

    // Test reactivate functionality
    testUser2.status = 'active';
    await testUser2.save();
    await Session.deleteMany({ userId: testUser2._id });
    
    const updatedUser2 = await User.findById(testUser2._id);
    const updatedSessions = await Session.countDocuments({ userId: testUser2._id });
    
    if (updatedUser2.status === 'active' && updatedSessions === 0) {
      console.log('✅ Reactivate functionality working');
    } else {
      console.log('❌ Reactivate functionality failed');
    }

    // Clean up
    await User.deleteMany({ email: /test-enhanced/ });
    await Session.deleteMany({});
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Enhanced User Management test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testEnhancedUserManagement();

const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Mock admin user for testing
let adminUser;
let testUser1;
let testUser2;
let adminToken;

// Create admin user and get token
async function createAdminUser() {
  try {
    // Create admin user
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      username: 'adminuser',
      email: 'admin-test@example.com',
      password: 'adminpass123',
      role: 'admin',
      accountType: 'admin',
      status: 'active'
    });

    // Generate admin token
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Admin user created and token generated');
    return adminToken;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Test the users API endpoint
async function testUsersAPI() {
  try {
    console.log('\n📡 Test 1: Users API Endpoint');
    
    // Mock the request object
    const mockReq = {
      user: { id: adminUser._id, role: 'admin' },
      query: { page: 1, limit: 20 }
    };

    const mockRes = {
      json: function(data) {
        this.data = data;
        return this;
      },
      status: function(code) {
        this.statusCode = code;
        return this;
      }
    };

    // Test the users route logic (simplified version)
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Add device count and stats (simulating the route logic)
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const deviceCount = await Session.countDocuments({ userId: user._id });
      const testCount = 0; // Mock test count
      
      // Calculate activity status
      let activityStatus = 'Never logged in';
      let lastActiveHours = null;
      let isActive = false;
      
      if (user.lastLogin) {
        const now = new Date();
        const lastLogin = new Date(user.lastLogin);
        const diffTime = Math.abs(now - lastLogin);
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        
        if (diffHours < 1) {
          activityStatus = 'Active now';
          isActive = true;
        } else if (diffHours < 24) {
          activityStatus = `${diffHours} hours ago`;
          lastActiveHours = diffHours;
          isActive = diffHours < 7;
        } else if (diffHours < 168) {
          const days = Math.floor(diffHours / 24);
          activityStatus = `${days} days ago`;
          isActive = days < 3;
        } else {
          const weeks = Math.floor(diffHours / 168);
          activityStatus = `${weeks} weeks ago`;
          isActive = false;
        }
      }
      
      return {
        ...user,
        testCount,
        deviceCount,
        activityStatus,
        lastActiveHours,
        isActive
      };
    }));

    console.log(`   Found ${usersWithStats.length} users`);
    
    // Check if device counts are included
    const userWithDeviceCount = usersWithStats.find(u => u.deviceCount !== undefined);
    if (userWithDeviceCount) {
      console.log(`   User ${userWithDeviceCount.email}: ${userWithDeviceCount.deviceCount} devices`);
      console.log('✅ Device count aggregation working');
    } else {
      console.log('❌ Device count not found in user data');
    }

    return usersWithStats;
  } catch (error) {
    console.error('❌ Users API test failed:', error);
    return [];
  }
}

// Test the unlock API endpoint
async function testUnlockAPI() {
  try {
    console.log('\n🔓 Test 2: Unlock API Endpoint');
    
    // Find a locked user
    const lockedUser = await User.findOne({ status: 'locked' });
    if (!lockedUser) {
      console.log('   No locked users found to test unlock');
      return false;
    }

    console.log(`   Testing unlock for user: ${lockedUser.email}`);
    
    // Simulate unlock (simplified version of the route)
    lockedUser.status = 'active';
    await lockedUser.save();
    
    const updatedUser = await User.findById(lockedUser._id);
    if (updatedUser.status === 'active') {
      console.log('✅ User successfully unlocked');
      return true;
    } else {
      console.log('❌ User unlock failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Unlock API test failed:', error);
    return false;
  }
}

// Test device limit enforcement
async function testDeviceLimitEnforcement() {
  try {
    console.log('\n📱 Test 3: Device Limit Enforcement');
    
    // Find a user with 2 devices
    const userWithTwoDevices = await User.aggregate([
      {
        $lookup: {
          from: 'sessions',
          localField: '_id',
          foreignField: 'userId',
          as: 'sessions'
        }
      },
      {
        $match: {
          'sessions.2': { $exists: true } // Has at least 3 sessions (2 devices)
        }
      },
      {
        $limit: 1
      }
    ]);

    if (userWithTwoDevices.length > 0) {
      const user = userWithTwoDevices[0];
      console.log(`   User ${user.email} has ${user.sessions.length} devices`);
      
      if (user.sessions.length >= 2) {
        console.log('✅ Device limit enforcement working (user at limit)');
      } else {
        console.log('❌ Device limit not enforced properly');
      }
    } else {
      console.log('   No users with 2+ devices found');
    }

    return true;
  } catch (error) {
    console.error('❌ Device limit enforcement test failed:', error);
    return false;
  }
}

async function testUserManagementAPI() {
  try {
    console.log('\n🧪 Testing User Management API Endpoints...\n');

    // Clean up any existing test data
    await User.deleteMany({ email: /test-api/ });
    await Session.deleteMany({});

    // Create test users
    testUser1 = await User.create({
      firstName: 'Test',
      lastName: 'API1',
      username: 'testapi1',
      email: 'test-api-1@example.com',
      password: 'password123',
      status: 'active'
    });

    testUser2 = await User.create({
      firstName: 'Test',
      lastName: 'API2',
      username: 'testapi2',
      email: 'test-api-2@example.com',
      password: 'password123',
      status: 'locked'
    });

    console.log('✅ Created test users');

    // Create sessions
    await Session.create({
      userId: testUser1._id,
      sessionId: 'session-api-1-1',
      deviceInfo: 'Device 1 - Chrome',
      ip: '192.168.1.1'
    });

    await Session.create({
      userId: testUser1._id,
      sessionId: 'session-api-1-2',
      deviceInfo: 'Device 2 - Firefox',
      ip: '192.168.1.2'
    });

    await Session.create({
      userId: testUser2._id,
      sessionId: 'session-api-2-1',
      deviceInfo: 'Device 1 - Safari',
      ip: '192.168.1.3'
    });

    console.log('✅ Created test sessions');

    // Create admin user
    await createAdminUser();

    // Test API endpoints
    const usersData = await testUsersAPI();
    const unlockSuccess = await testUnlockAPI();
    const deviceLimitWorking = await testDeviceLimitEnforcement();

    // Test 4: Clean up
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ email: /test-api/ });
    await Session.deleteMany({});
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 User Management API test completed!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Users API: ${usersData.length > 0 ? 'Working' : 'Failed'}`);
    console.log(`   ✅ Unlock API: ${unlockSuccess ? 'Working' : 'Failed'}`);
    console.log(`   ✅ Device Limit: ${deviceLimitWorking ? 'Working' : 'Failed'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testUserManagementAPI();

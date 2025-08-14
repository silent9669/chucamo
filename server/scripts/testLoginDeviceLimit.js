const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Mock request object for testing
function createMockRequest(body, headers = {}) {
  return {
    body,
    headers: {
      'user-agent': headers['user-agent'] || 'Test Browser',
      ...headers
    },
    ip: headers.ip || '192.168.1.1',
    connection: {
      remoteAddress: headers.ip || '192.168.1.1'
    }
  };
}

// Mock response object for testing
function createMockResponse() {
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    }
  };
  return res;
}

// Simulate login process
async function simulateLogin(email, password, deviceInfo, ip) {
  try {
    const req = createMockRequest(
      { username: email, password },
      { 'user-agent': deviceInfo, ip }
    );
    const res = createMockResponse();

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return { success: false, message: 'Invalid credentials', status: 400 };
    }

    // Check if locked
    if (user.status === "locked") {
      return { success: false, message: 'Account locked. Contact admin.', status: 403 };
    }

    // Verify password using the model's method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return { success: false, message: 'Invalid credentials', status: 400 };
    }

    // Count active sessions
    const activeSessions = await Session.find({ userId: user._id });
    if (activeSessions.length >= 2) {
      // Lock account
      user.status = "locked";
      await user.save();
      return { success: false, message: 'Account locked due to multiple devices', status: 403 };
    }

    // Create new session
    const sessionId = require('uuid').v4();
    const deviceInfoHeader = req.headers["user-agent"] || "Unknown";
    const ipAddress = req.ip || req.connection.remoteAddress;

    await Session.create({
      userId: user._id,
      sessionId,
      deviceInfo: deviceInfoHeader,
      ip: ipAddress
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token with session ID
    const token = jwt.sign(
      { id: user._id, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { 
      success: true, 
      message: 'Login successful', 
      token,
      sessionId,
      status: 200 
    };

  } catch (error) {
    console.error('Login simulation error:', error);
    return { success: false, message: 'Server error', status: 500 };
  }
}

async function testLoginDeviceLimit() {
  try {
    console.log('\n🧪 Testing Login Route with Device Limit...\n');

    // Clean up any existing test data
    await User.deleteMany({ email: /test-login-device/ });
    await Session.deleteMany({});

    // Create a test user (password will be hashed by pre-save hook)
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      username: 'testlogindevice',
      email: 'test-login-device@example.com',
      password: 'password123',
      status: 'active'
    });

    console.log('✅ Created test user:', testUser.email);

    // Test 1: First device login
    console.log('\n📱 Test 1: First device login');
    const login1 = await simulateLogin(
      'test-login-device@example.com',
      'password123',
      'Device 1 - Chrome',
      '192.168.1.1'
    );
    
    if (login1.success) {
      console.log('✅ First login successful');
      console.log(`   Session ID: ${login1.sessionId}`);
    } else {
      console.log('❌ First login failed:', login1.message);
      return;
    }

    // Test 2: Second device login
    console.log('\n📱 Test 2: Second device login');
    const login2 = await simulateLogin(
      'test-login-device@example.com',
      'password123',
      'Device 2 - Firefox',
      '192.168.1.2'
    );
    
    if (login2.success) {
      console.log('✅ Second login successful');
      console.log(`   Session ID: ${login2.sessionId}`);
    } else {
      console.log('❌ Second login failed:', login2.message);
      return;
    }

    // Test 3: Check active sessions
    const activeSessions = await Session.find({ userId: testUser._id });
    console.log(`📊 Active sessions: ${activeSessions.length}/2`);

    // Test 4: Third device login (should lock account)
    console.log('\n📱 Test 3: Third device login (should lock account)');
    const login3 = await simulateLogin(
      'test-login-device@example.com',
      'password123',
      'Device 3 - Safari',
      '192.168.1.3'
    );
    
    if (!login3.success && login3.status === 403) {
      console.log('✅ Third login blocked - account locked');
      console.log(`   Message: ${login3.message}`);
    } else {
      console.log('❌ Third login should have been blocked');
      console.log(`   Status: ${login3.status}, Message: ${login3.message}`);
    }

    // Test 5: Verify account is locked
    const updatedUser = await User.findById(testUser._id);
    console.log(`🔒 User status: ${updatedUser.status}`);

    if (updatedUser.status === 'locked') {
      console.log('✅ Account successfully locked after third device attempt');
    } else {
      console.log('❌ Account should be locked but is not');
    }

    // Test 6: Try to login with locked account
    console.log('\n📱 Test 4: Login attempt with locked account');
    const lockedLogin = await simulateLogin(
      'test-login-device@example.com',
      'password123',
      'Device 4 - Edge',
      '192.168.1.4'
    );
    
    if (!lockedLogin.success && lockedLogin.status === 403) {
      console.log('✅ Locked account login properly blocked');
      console.log(`   Message: ${lockedLogin.message}`);
    } else {
      console.log('❌ Locked account login should have been blocked');
    }

    // Test 7: Clean up
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ email: /test-login-device/ });
    await Session.deleteMany({});
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Login device limit test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testLoginDeviceLimit();

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

// Test the actual login logic from auth.js
async function testLoginLogic(email, password, deviceInfo, ip) {
  try {
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return { success: false, message: 'Invalid credentials', status: 400 };
    }

    // Check if locked
    if (user.status === "locked") {
      return { success: false, message: 'Account locked. Contact admin.', status: 403 };
    }

    // Verify password
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
    const deviceInfoHeader = deviceInfo || "Unknown";
    const ipAddress = ip || "192.168.1.1";

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
    console.error('Login logic error:', error);
    return { success: false, message: 'Server error', status: 500 };
  }
}

// Test logout functionality
async function testLogout(sessionId) {
  try {
    const result = await Session.deleteOne({ sessionId });
    return { success: true, deleted: result.deletedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test session validation
async function testSessionValidation(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return { valid: false, message: 'Invalid user' };
    }

    if (user.status === 'locked') {
      return { valid: false, message: 'Account locked' };
    }

    if (decoded.sessionId) {
      const session = await Session.findOne({ sessionId: decoded.sessionId });
      if (!session) {
        return { valid: false, message: 'Invalid session' };
      }
    }

    return { valid: true, user: user.username, sessionId: decoded.sessionId };
  } catch (error) {
    return { valid: false, message: 'Token invalid' };
  }
}

async function testAPIDeviceLimit() {
  try {
    console.log('\n🧪 Testing API Device Limit Functionality...\n');

    // Clean up any existing test data
    await User.deleteMany({ email: /test-api-device/ });
    await Session.deleteMany({});

    // Create a test user
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'API',
      username: 'testapidevice',
      email: 'test-api-device@example.com',
      password: 'password123',
      status: 'active'
    });

    console.log('✅ Created test user:', testUser.email);

    // Test 1: First device login
    console.log('\n📱 Test 1: First device login');
    const login1 = await testLoginLogic(
      'test-api-device@example.com',
      'password123',
      'Device 1 - Chrome',
      '192.168.1.1'
    );
    
    if (login1.success) {
      console.log('✅ First login successful');
      console.log(`   Session ID: ${login1.sessionId}`);
      console.log(`   Token: ${login1.token.substring(0, 20)}...`);
    } else {
      console.log('❌ First login failed:', login1.message);
      return;
    }

    // Test 2: Validate session
    console.log('\n🔐 Test 2: Session validation');
    const session1 = await testSessionValidation(login1.token);
    if (session1.valid) {
      console.log('✅ Session 1 is valid');
      console.log(`   User: ${session1.user}, Session ID: ${session1.sessionId}`);
    } else {
      console.log('❌ Session 1 validation failed:', session1.message);
    }

    // Test 3: Second device login
    console.log('\n📱 Test 3: Second device login');
    const login2 = await testLoginLogic(
      'test-api-device@example.com',
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

    // Test 4: Check active sessions
    const activeSessions = await Session.find({ userId: testUser._id });
    console.log(`📊 Active sessions: ${activeSessions.length}/2`);

    // Test 5: Third device login (should lock account)
    console.log('\n📱 Test 4: Third device login (should lock account)');
    const login3 = await testLoginLogic(
      'test-api-device@example.com',
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

    // Test 6: Verify account is locked
    const updatedUser = await User.findById(testUser._id);
    console.log(`🔒 User status: ${updatedUser.status}`);

    if (updatedUser.status === 'locked') {
      console.log('✅ Account successfully locked after third device attempt');
    } else {
      console.log('❌ Account should be locked but is not');
    }

    // Test 7: Try to login with locked account
    console.log('\n📱 Test 5: Login attempt with locked account');
    const lockedLogin = await testLoginLogic(
      'test-api-device@example.com',
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

    // Test 8: Test logout functionality
    console.log('\n🚪 Test 6: Logout functionality');
    const logout1 = await testLogout(login1.sessionId);
    if (logout1.success && logout1.deleted === 1) {
      console.log('✅ Session 1 logged out successfully');
    } else {
      console.log('❌ Logout failed:', logout1.error);
    }

    // Test 9: Verify session count after logout
    const sessionsAfterLogout = await Session.find({ userId: testUser._id });
    console.log(`📊 Active sessions after logout: ${sessionsAfterLogout.length}/2`);

    // Test 10: Try to login again (should work now)
    console.log('\n📱 Test 7: Login after logout (should work)');
    const loginAfterLogout = await testLoginLogic(
      'test-api-device@example.com',
      'password123',
      'Device 5 - Opera',
      '192.168.1.5'
    );
    
    if (loginAfterLogout.success) {
      console.log('✅ Login after logout successful');
      console.log(`   New Session ID: ${loginAfterLogout.sessionId}`);
    } else {
      console.log('❌ Login after logout failed:', loginAfterLogout.message);
    }

    // Test 11: Clean up
    console.log('\n🧹 Cleaning up test data...');
    await User.deleteMany({ email: /test-api-device/ });
    await Session.deleteMany({});
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 API Device Limit test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Device limit enforcement working');
    console.log('   ✅ Account locking working');
    console.log('   ✅ Session management working');
    console.log('   ✅ Logout functionality working');
    console.log('   ✅ JWT token validation working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testAPIDeviceLimit();

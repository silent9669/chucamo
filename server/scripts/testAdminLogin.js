const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const testAdminLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ 
      $or: [
        { email: 'admin@example.com' },
        { username: 'admin' }
      ]
    }).select('+password');

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('- Email:', adminUser.email);
    console.log('- Username:', adminUser.username);
    console.log('- Role:', adminUser.role);
    console.log('- Password field exists:', !!adminUser.password);

    // Test password
    const testPassword = 'admin123';
    const isMatch = await adminUser.comparePassword(testPassword);
    
    console.log('🔍 Testing password:', testPassword);
    console.log('✅ Password match:', isMatch);

    if (!isMatch) {
      console.log('❌ Password does not match. Resetting password...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log('✅ Password reset to: admin123');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

testAdminLogin();

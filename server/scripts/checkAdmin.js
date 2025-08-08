const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const checkAdmin = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Check for superadmin user
    console.log('\n🔍 Looking for superadmin user...');
    const superadmin = await User.findOne({
      $or: [
        { username: 'superadmin' },
        { email: 'superadmin@example.com' }
      ]
    }).select('+password');

    if (superadmin) {
      console.log('✅ Superadmin user found:');
      console.log('- ID:', superadmin._id);
      console.log('- Username:', superadmin.username);
      console.log('- Email:', superadmin.email);
      console.log('- Role:', superadmin.role);
      console.log('- Is Active:', superadmin.isActive);
      console.log('- Email Verified:', superadmin.emailVerified);
      console.log('- Created:', superadmin.createdAt);
      console.log('- Last Login:', superadmin.lastLogin);
    } else {
      console.log('❌ Superadmin user not found');
    }

    // Check for backupadmin user
    console.log('\n🔍 Looking for backupadmin user...');
    const backupadmin = await User.findOne({
      $or: [
        { username: 'backupadmin' },
        { email: 'backupadmin@example.com' }
      ]
    }).select('+password');

    if (backupadmin) {
      console.log('✅ Backupadmin user found:');
      console.log('- ID:', backupadmin._id);
      console.log('- Username:', backupadmin.username);
      console.log('- Email:', backupadmin.email);
      console.log('- Role:', backupadmin.role);
      console.log('- Is Active:', backupadmin.isActive);
      console.log('- Email Verified:', backupadmin.emailVerified);
      console.log('- Created:', backupadmin.createdAt);
      console.log('- Last Login:', backupadmin.lastLogin);
    } else {
      console.log('❌ Backupadmin user not found');
    }

    // Test the exact query used in login
    console.log('\n🔍 Testing login query for superadmin...');
    const loginQuery = await User.findOne({
      $or: [
        { username: 'superadmin' },
        { email: 'superadmin@example.com' }
      ]
    }).select('+password');

    if (loginQuery) {
      console.log('✅ Login query successful - user found');
      console.log('- Username:', loginQuery.username);
      console.log('- Password hash exists:', !!loginQuery.password);
    } else {
      console.log('❌ Login query failed - user not found');
    }

    // List all admin users
    console.log('\n🔍 Listing all admin users...');
    const allAdmins = await User.find({ role: 'admin' });
    console.log(`Found ${allAdmins.length} admin users:`);
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. Username: ${admin.username}, Email: ${admin.email}, Role: ${admin.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

checkAdmin();

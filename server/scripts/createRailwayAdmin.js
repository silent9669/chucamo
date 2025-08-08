const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const createRailwayAdmin = async () => {
  try {
    console.log('🔍 Connecting to Railway MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Railway MongoDB successfully');

    // Check for existing admin users
    const existingAdmins = await User.find({ role: 'admin' });
    console.log(`Found ${existingAdmins.length} existing admin users:`);
    existingAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. Username: ${admin.username}, Email: ${admin.email}`);
    });

    // Create superadmin if it doesn't exist
    let superadmin = await User.findOne({ username: 'superadmin' });
    if (!superadmin) {
      superadmin = new User({
        firstName: 'Super',
        lastName: 'Admin',
        username: 'superadmin',
        email: 'superadmin@example.com',
        password: 'admin123456',
        role: 'admin',
        accountType: 'student',
        emailVerified: true,
        isActive: true,
        grade: 12,
        school: 'Admin School',
        targetScore: 1600
      });
      await superadmin.save();
      console.log('✅ Superadmin user created successfully!');
      console.log('👤 Username: superadmin');
      console.log('🔑 Password: admin123456');
    } else {
      console.log('✅ Superadmin user already exists');
    }

    // Create backupadmin if it doesn't exist
    let backupadmin = await User.findOne({ username: 'backupadmin' });
    if (!backupadmin) {
      backupadmin = new User({
        firstName: 'Backup',
        lastName: 'Admin',
        username: 'backupadmin',
        email: 'backupadmin@example.com',
        password: 'admin123456',
        role: 'admin',
        accountType: 'student',
        emailVerified: true,
        isActive: true,
        grade: 12,
        school: 'Backup School',
        targetScore: 1600
      });
      await backupadmin.save();
      console.log('✅ Backupadmin user created successfully!');
      console.log('👤 Username: backupadmin');
      console.log('🔑 Password: admin123456');
    } else {
      console.log('✅ Backupadmin user already exists');
    }

    console.log('\n🎯 Available Admin Accounts:');
    console.log('1. Username: superadmin, Password: admin123456');
    console.log('2. Username: backupadmin, Password: admin123456');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from Railway MongoDB');
  }
};

createRailwayAdmin();

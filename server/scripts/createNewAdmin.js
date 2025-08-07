const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const createNewAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete any existing admin users first
    await User.deleteMany({ role: 'admin' });
    console.log('🗑️ Deleted existing admin users');

    // Create a completely new admin user (password will be hashed automatically by the model)
    const newAdminUser = new User({
      firstName: 'Super',
      lastName: 'Admin',
      username: 'superadmin',
      email: 'superadmin@example.com',
      password: 'admin123456', // Will be hashed automatically by the model
      role: 'admin',
      accountType: 'student',
      emailVerified: true,
      isActive: true,
      grade: 12,
      school: 'Admin School',
      targetScore: 1600
    });

    await newAdminUser.save();
    console.log('✅ New admin user created successfully!');
    console.log('📧 Email: superadmin@example.com');
    console.log('👤 Username: superadmin');
    console.log('🔑 Password: admin123456');
    console.log('👑 Role: admin');

    // Also create a backup admin with different credentials
    const backupAdminUser = new User({
      firstName: 'Backup',
      lastName: 'Admin',
      username: 'backupadmin',
      email: 'backupadmin@example.com',
      password: 'password123', // Will be hashed automatically by the model
      role: 'admin',
      accountType: 'student',
      emailVerified: true,
      isActive: true,
      grade: 12,
      school: 'Backup School',
      targetScore: 1600
    });

    await backupAdminUser.save();
    console.log('✅ Backup admin user created successfully!');
    console.log('📧 Email: backupadmin@example.com');
    console.log('👤 Username: backupadmin');
    console.log('🔑 Password: password123');
    console.log('👑 Role: admin');

    // Test the login for both accounts
    console.log('\n🧪 Testing login credentials...');
    
    const testUser1 = await User.findOne({ username: 'superadmin' }).select('+password');
    const testUser2 = await User.findOne({ username: 'backupadmin' }).select('+password');
    
    const test1 = await testUser1.comparePassword('admin123456');
    const test2 = await testUser2.comparePassword('password123');
    
    console.log('✅ Superadmin password test:', test1);
    console.log('✅ Backup admin password test:', test2);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createNewAdmin();

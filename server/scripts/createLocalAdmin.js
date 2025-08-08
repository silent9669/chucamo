const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const createLocalAdmin = async () => {
  try {
    // For local development, use local MongoDB
    const localMongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bluebook-sat-simulator';
    
    console.log('🔗 Connecting to local MongoDB...');
    console.log('📍 URI:', localMongoURI);
    
    await mongoose.connect(localMongoURI);
    console.log('✅ Connected to local MongoDB successfully!');

    // Delete any existing admin users first
    await User.deleteMany({ role: 'admin' });
    console.log('🗑️ Deleted existing admin users');

    // Create a local admin user
    const localAdminUser = new User({
      firstName: 'Local',
      lastName: 'Admin',
      username: 'localadmin',
      email: 'localadmin@localhost.com',
      password: 'admin123', // Will be hashed automatically by the model
      role: 'admin',
      accountType: 'student',
      emailVerified: true,
      isActive: true,
      grade: 12,
      school: 'Local Development School',
      targetScore: 1600
    });

    await localAdminUser.save();
    console.log('\n✅ Local admin user created successfully!');
    console.log('📧 Email: localadmin@localhost.com');
    console.log('👤 Username: localadmin');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: admin');

    // Create a second admin for backup
    const backupLocalAdmin = new User({
      firstName: 'Backup',
      lastName: 'Local Admin',
      username: 'backuplocal',
      email: 'backuplocal@localhost.com',
      password: 'password123', // Will be hashed automatically by the model
      role: 'admin',
      accountType: 'student',
      emailVerified: true,
      isActive: true,
      grade: 12,
      school: 'Backup Local School',
      targetScore: 1600
    });

    await backupLocalAdmin.save();
    console.log('\n✅ Backup local admin user created successfully!');
    console.log('📧 Email: backuplocal@localhost.com');
    console.log('👤 Username: backuplocal');
    console.log('🔑 Password: password123');
    console.log('👑 Role: admin');

    // Test the login for both accounts
    console.log('\n🧪 Testing login credentials...');
    
    const testUser1 = await User.findOne({ username: 'localadmin' }).select('+password');
    const testUser2 = await User.findOne({ username: 'backuplocal' }).select('+password');
    
    const test1 = await testUser1.comparePassword('admin123');
    const test2 = await testUser2.comparePassword('password123');
    
    console.log('✅ Local admin password test:', test1);
    console.log('✅ Backup local admin password test:', test2);

    console.log('\n🎉 Local admin accounts are ready!');
    console.log('🚀 Start your local server and try logging in with:');
    console.log('   Username: localadmin');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure MongoDB is running locally!');
      console.log('   You can start it with: mongod');
      console.log('   Or use the start-mongodb.bat file if available');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

createLocalAdmin();

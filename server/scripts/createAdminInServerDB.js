const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const createAdminInServerDB = async () => {
  try {
    // Use the EXACT same connection logic as the server
    let MONGODB_URI = process.env.MONGODB_URI;
    
    console.log('🔍 Server Database Connection Check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    // If no MONGODB_URI is set, use a fallback for development
    if (!MONGODB_URI) {
      console.log('No MONGODB_URI found in environment variables');
      if (process.env.NODE_ENV === 'production') {
        console.error('MONGODB_URI is required in production!');
        return;
      } else {
        MONGODB_URI = 'mongodb://localhost:27017/bluebook-sat-simulator';
        console.log('Using local MongoDB for development');
      }
    }
    
    console.log('📍 Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    // Check database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('📊 Database name:', dbName);
    
    // Check existing users
    const allUsers = await User.find({});
    console.log(`📊 Found ${allUsers.length} total users in this database:`);
    
    allUsers.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    });
    
    // Check if admin users already exist
    const existingAdmins = await User.find({ role: 'admin' });
    console.log(`\n👑 Found ${existingAdmins.length} existing admin users`);
    
    if (existingAdmins.length > 0) {
      console.log('✅ Admin users already exist!');
      return;
    }
    
    // Create admin users in this database
    console.log('\n🔧 Creating admin users in this database...');
    
    const adminUser = new User({
      firstName: 'Server',
      lastName: 'Admin',
      username: 'serveradmin',
      email: 'serveradmin@localhost.com',
      password: 'admin123',
      role: 'admin',
      accountType: 'student',
      emailVerified: true,
      isActive: true,
      grade: 12,
      school: 'Server Database School',
      targetScore: 1600
    });

    await adminUser.save();
    console.log('✅ Server admin user created successfully!');
    console.log('📧 Email: serveradmin@localhost.com');
    console.log('👤 Username: serveradmin');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: admin');

    // Test the login
    const testUser = await User.findOne({ username: 'serveradmin' }).select('+password');
    const isMatch = await testUser.comparePassword('admin123');
    console.log('\n🧪 Password test for serveradmin:', isMatch);

    console.log('\n🎉 Server admin account is ready!');
    console.log('🚀 Try logging in with:');
    console.log('   Username: serveradmin');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

createAdminInServerDB();

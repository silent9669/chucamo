const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const checkServerDatabase = async () => {
  try {
    // Use the same connection logic as the server
    let MONGODB_URI = process.env.MONGODB_URI;
    
    console.log('🔍 Server Database Check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('- MONGODB_URI length:', MONGODB_URI ? MONGODB_URI.length : 0);
    
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
    
    console.log('📍 Final URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    // Check database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('📊 Database name:', dbName);
    
    // Check if admin users exist
    const adminUsers = await User.find({ role: 'admin' }).select('+password');
    console.log(`📊 Found ${adminUsers.length} admin users in this database:`);
    
    adminUsers.forEach((user, index) => {
      console.log(`\n👤 Admin ${index + 1}:`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password field exists: ${!!user.password}`);
    });
    
    // Test login
    const localAdmin = await User.findOne({ username: 'localadmin' }).select('+password');
    if (localAdmin) {
      const isMatch = await localAdmin.comparePassword('admin123');
      console.log('\n🧪 Password test for localadmin:', isMatch);
    } else {
      console.log('\n❌ localadmin user not found in this database!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

checkServerDatabase();

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./server/models/User');

const testServerLogin = async () => {
  try {
    // Use the EXACT same connection logic as the server
    let MONGODB_URI = process.env.MONGODB_URI;
    
    console.log('🔍 Testing server database connection...');
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
    
    // Test login logic exactly like the server
    console.log('\n🧪 Testing server login logic...');
    
    const username = 'localadmin';
    const password = 'admin123';
    
    console.log('🔍 Looking for user with:', username);
    
    // Use the exact same query as the server
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username.toLowerCase() }
      ]
    }).select('+password');
    
    if (!user) {
      console.log('❌ User not found:', username);
      return;
    }
    
    console.log('✅ User found:', user.username, 'Role:', user.role);
    console.log('🔍 Testing password...');
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', user.username);
      return;
    }
    
    console.log('✅ Password verified for user:', user.username);
    console.log('🎉 Login would be successful!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

testServerLogin();

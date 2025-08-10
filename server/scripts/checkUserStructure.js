const mongoose = require('mongoose');
require('dotenv').config();

const checkUserStructure = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    const User = require('../models/User');

    // Check the specific user ID that's referenced in articles
    const userId = '6894a20a34786d0a496b6cdc';
    console.log(`🔍 Checking user with ID: ${userId}`);
    
    try {
      const user = await User.findById(userId);
      if (user) {
        console.log('✅ User found!');
        console.log(`Username: ${user.username}`);
        console.log(`First Name: ${user.firstName}`);
        console.log(`Last Name: ${user.lastName}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Is Active: ${user.isActive}`);
        
        // Check if all required fields are present
        const requiredFields = ['firstName', 'lastName', 'username', 'email'];
        const missingFields = requiredFields.filter(field => !user[field]);
        
        if (missingFields.length > 0) {
          console.log(`⚠️  Missing required fields: ${missingFields.join(', ')}`);
        } else {
          console.log('✅ All required fields present');
        }
      } else {
        console.log('❌ User not found');
      }
    } catch (error) {
      console.log(`❌ Error checking user: ${error.message}`);
    }

    // Check total users in database
    const totalUsers = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

    // Check if there are any users at all
    if (totalUsers > 0) {
      const sampleUser = await User.findOne().select('username firstName lastName email role');
      console.log('\n📋 Sample user structure:');
      console.log(sampleUser);
    }

    console.log('\n✅ User structure check completed!');

  } catch (error) {
    console.error('❌ Error checking user structure:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

checkUserStructure();

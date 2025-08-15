const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const createProAccount = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if pro user already exists
    const existingProUser = await User.findOne({ 
      $or: [
        { email: 'pro@example.com' },
        { username: 'prouser' },
        { accountType: 'pro' }
      ]
    });

    if (existingProUser) {
      console.log('✅ Pro user already exists:');
      console.log('- Email:', existingProUser.email);
      console.log('- Username:', existingProUser.username);
      console.log('- Account Type:', existingProUser.accountType);
      
      // Reset password to default
      existingProUser.password = 'pro123'; // Will be hashed by the model
      await existingProUser.save();
      console.log('✅ Pro user password reset to: pro123');
      
      return;
    }

    // Create new pro user
    const proUser = new User({
      firstName: 'Pro',
      lastName: 'User',
      username: 'prouser',
      email: 'pro@example.com',
      password: 'pro123', // Will be hashed automatically by the model
      role: 'user',
      accountType: 'pro',
      emailVerified: true,
      isActive: true,
      grade: 12,
      school: 'Pro School',
      targetScore: 1600
    });

    await proUser.save();
    console.log('✅ Pro user created successfully!');
    console.log('📧 Email: pro@example.com');
    console.log('👤 Username: prouser');
    console.log('🔑 Password: pro123');
    console.log('👑 Account Type: pro');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createProAccount();

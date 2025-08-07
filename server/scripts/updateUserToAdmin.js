const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const updateUserToAdmin = async (userEmail) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('User not found with email:', userEmail);
      return;
    }

    // Update user to admin
    user.role = 'admin';
    await user.save();
    
    console.log(`User ${userEmail} has been updated to admin role successfully!`);

  } catch (error) {
    console.error('Error updating user to admin:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Usage: node updateUserToAdmin.js user@example.com
const userEmail = process.argv[2];
if (!userEmail) {
  console.log('Please provide an email address: node updateUserToAdmin.js user@example.com');
  process.exit(1);
}

updateUserToAdmin(userEmail);

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateMyAccountToAdmin = async () => {
  try {
    // Replace 'your-email@example.com' with your actual email
    const yourEmail = 'backupadmin@example.com'; // Change this to your email
    
    console.log('Looking for user with email:', yourEmail);
    
    const user = await User.findOne({ email: yourEmail });
    
    if (!user) {
      console.log('User not found. Please check the email address.');
      console.log('Available users:');
      const allUsers = await User.find({}, 'email firstName lastName accountType role');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.firstName} ${u.lastName}) - Role: ${u.role}, AccountType: ${u.accountType}`);
      });
      return;
    }
    
    console.log('Found user:', user.firstName, user.lastName);
    console.log('Current accountType:', user.accountType);
    console.log('Current role:', user.role);
    
    // Update the account type to admin
    user.accountType = 'admin';
    user.role = 'admin'; // Also update role for consistency
    
    await user.save();
    
    console.log('✅ Successfully updated account to admin!');
    console.log('New accountType:', user.accountType);
    console.log('New role:', user.role);
    
  } catch (error) {
    console.error('Error updating account:', error);
  } finally {
    mongoose.connection.close();
  }
};

updateMyAccountToAdmin();

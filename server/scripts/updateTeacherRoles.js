const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const updateTeacherRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bluebook-sat-simulator');
    console.log('Connected to MongoDB');

    // Find all users with teacher role
    const teacherUsers = await User.find({ role: 'teacher' });
    
    if (teacherUsers.length === 0) {
      console.log('No users with teacher role found.');
      return;
    }

    console.log(`Found ${teacherUsers.length} users with teacher role.`);

    // Update all teacher users to student role
    const updateResult = await User.updateMany(
      { role: 'teacher' },
      { role: 'student' }
    );

    console.log(`✅ Successfully updated ${updateResult.modifiedCount} users from teacher to student role.`);

    // Verify the changes
    const remainingTeacherUsers = await User.find({ role: 'teacher' });
    console.log(`Remaining users with teacher role: ${remainingTeacherUsers.length}`);

  } catch (error) {
    console.error('Error updating teacher roles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
updateTeacherRoles();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const updateAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bluebook-sat-simulator');
    console.log('Connected to MongoDB');

    // Find existing admin user
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      console.log('No admin user found. Creating new admin user...');
      
      // Create admin user
      const adminData = {
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin',
        email: 'admin@bluebook.com',
        password: 'admin123',
        role: 'admin',
        grade: 12,
        school: 'Bluebook Academy',
        targetScore: 1600,
        studyGoals: 'Help students achieve their SAT goals',
        isActive: true,
        emailVerified: true
      };

      const adminUser = new User(adminData);
      await adminUser.save();

      console.log('✅ Admin user created successfully!');
      console.log('👤 Username:', adminData.username);
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password:', adminData.password);
      console.log('👤 Role:', adminData.role);
    } else {
      console.log('Updating existing admin user...');
      
      // Update existing admin with username and new password
      existingAdmin.username = 'admin';
      existingAdmin.password = 'admin123';
      await existingAdmin.save();

      console.log('✅ Admin user updated successfully!');
      console.log('👤 Username:', existingAdmin.username);
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔑 Password: admin123');
      console.log('👤 Role:', existingAdmin.role);
    }

    console.log('\nYou can now login with these credentials at http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error updating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

updateAdminUser(); 
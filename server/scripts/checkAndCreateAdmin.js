const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const checkAndCreateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@example.com' },
        { username: 'admin' },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log('- Email:', existingAdmin.email);
      console.log('- Username:', existingAdmin.username);
      console.log('- Role:', existingAdmin.role);
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash('admin123', 12);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('✅ Admin password updated to: admin123');
      
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      accountType: 'student',
      emailVerified: true,
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

checkAndCreateAdmin();

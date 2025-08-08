const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@example.com' },
        { username: 'superadmin' },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log('- Email:', existingAdmin.email);
      console.log('- Username:', existingAdmin.username);
      console.log('- Role:', existingAdmin.role);
      
      // Reset password to default
      existingAdmin.password = 'admin123'; // Will be hashed by the model
      await existingAdmin.save();
      console.log('✅ Admin password reset to: admin123');
      
      return;
    }

    // Create new admin user
    const adminUser = new User({
      firstName: 'Super',
      lastName: 'Admin',
      username: 'superadmin',
      email: 'admin@example.com',
      password: 'admin123', // Will be hashed automatically by the model
      role: 'admin',
      accountType: 'student',
      emailVerified: true,
      isActive: true,
      grade: 12,
      school: 'Admin School',
      targetScore: 1600
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('👤 Username: superadmin');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: admin');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();

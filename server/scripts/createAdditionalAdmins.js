const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chucamo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('../models/User');

async function createAdditionalAdmins() {
  try {
    console.log('🔐 Creating additional admin accounts...');
    
    // Admin account 1
    const admin1 = new User({
      username: 'admin2',
      email: 'admin2@chucamo.com',
      password: 'admin123456', // This will be hashed by the User model
      firstName: 'Admin',
      lastName: 'Two',
      role: 'admin',
      accountType: 'admin',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      lastLogin: new Date()
    });

    // Admin account 2
    const admin2 = new User({
      username: 'admin3',
      email: 'admin3@chucamo.com',
      password: 'admin123456', // This will be hashed by the User model
      firstName: 'Admin',
      lastName: 'Three',
      role: 'admin',
      accountType: 'admin',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      lastLogin: new Date()
    });

    // Check if accounts already exist
    const existingAdmin1 = await User.findOne({ email: admin1.email });
    const existingAdmin2 = await User.findOne({ email: admin2.email });

    if (existingAdmin1) {
      console.log('⚠️  Admin account 1 already exists:', existingAdmin1.email);
    } else {
      await admin1.save();
      console.log('✅ Admin account 1 created successfully:', admin1.email);
    }

    if (existingAdmin2) {
      console.log('⚠️  Admin account 2 already exists:', existingAdmin2.email);
    } else {
      await admin2.save();
      console.log('✅ Admin account 2 created successfully:', admin2.email);
    }

    // Display all admin accounts
    const allAdmins = await User.find({ role: 'admin' });
    console.log('\n📊 Current admin accounts:');
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username} (${admin.email}) - ${admin.role}`);
    });

  } catch (error) {
    console.error('❌ Error creating admin accounts:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createAdditionalAdmins();

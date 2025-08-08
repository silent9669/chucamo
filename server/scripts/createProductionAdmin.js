const mongoose = require('mongoose');
const User = require('../models/User');

const createProductionAdmin = async () => {
  try {
    // Connect to production database
    const productionURI = 'mongodb+srv://phucchemistry69:admin123456@cluster0.kk3a14q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('🔗 Connecting to production MongoDB...');
    console.log('📍 URI:', productionURI.substring(0, 50) + '...');
    
    await mongoose.connect(productionURI);
    console.log('✅ Connected to production MongoDB successfully!');
    
    // Check database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('📊 Database name:', dbName);
    
    // Delete any existing admin users first
    await User.deleteMany({ role: 'admin' });
    console.log('🗑️ Deleted existing admin users');

    // Create a production admin user
    const productionAdminUser = new User({
      firstName: 'Production',
      lastName: 'Admin',
      username: 'prodadmin',
      email: 'prodadmin@example.com',
      password: 'admin123', // Will be hashed automatically by the model
      role: 'admin',
      accountType: 'student',
      emailVerified: true,
      isActive: true,
      grade: 12,
      school: 'Production School',
      targetScore: 1600
    });

    await productionAdminUser.save();
    console.log('\n✅ Production admin user created successfully!');
    console.log('📧 Email: prodadmin@example.com');
    console.log('👤 Username: prodadmin');
    console.log('🔑 Password: admin123');
    console.log('👑 Role: admin');

    // Create a backup admin
    const backupAdminUser = new User({
      firstName: 'Backup',
      lastName: 'Production Admin',
      username: 'backupprod',
      email: 'backupprod@example.com',
      password: 'password123', // Will be hashed automatically by the model
      role: 'admin',
      accountType: 'student',
      emailVerified: true,
      isActive: true,
      grade: 12,
      school: 'Backup Production School',
      targetScore: 1600
    });

    await backupAdminUser.save();
    console.log('\n✅ Backup production admin user created successfully!');
    console.log('📧 Email: backupprod@example.com');
    console.log('👤 Username: backupprod');
    console.log('🔑 Password: password123');
    console.log('👑 Role: admin');

    // Test the login for both accounts
    console.log('\n🧪 Testing login credentials...');
    
    const testUser1 = await User.findOne({ username: 'prodadmin' }).select('+password');
    const testUser2 = await User.findOne({ username: 'backupprod' }).select('+password');
    
    const test1 = await testUser1.comparePassword('admin123');
    const test2 = await testUser2.comparePassword('password123');
    
    console.log('✅ Production admin password test:', test1);
    console.log('✅ Backup production admin password test:', test2);

    console.log('\n🎉 Production admin accounts are ready!');
    console.log('🚀 Try logging in with:');
    console.log('   Username: prodadmin');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

createProductionAdmin();

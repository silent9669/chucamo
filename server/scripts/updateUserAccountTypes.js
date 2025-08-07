const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const updateUserAccountTypes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all users without accountType field
    const usersWithoutAccountType = await User.find({
      accountType: { $exists: false }
    });

    console.log(`Found ${usersWithoutAccountType.length} users without accountType field`);

    if (usersWithoutAccountType.length > 0) {
      // Update all users to have accountType: 'free'
      const result = await User.updateMany(
        { accountType: { $exists: false } },
        { $set: { accountType: 'free' } }
      );

      console.log(`Updated ${result.modifiedCount} users with accountType: 'free'`);
    } else {
      console.log('All users already have accountType field');
    }

    // Also update tests without visibleTo field
    const Test = require('../models/Test');
    const testsWithoutVisibleTo = await Test.find({
      visibleTo: { $exists: false }
    });

    console.log(`Found ${testsWithoutVisibleTo.length} tests without visibleTo field`);

    if (testsWithoutVisibleTo.length > 0) {
      // Update all tests to have visibleTo: 'all' (maintains backward compatibility)
      const testResult = await Test.updateMany(
        { visibleTo: { $exists: false } },
        { $set: { visibleTo: 'all' } }
      );

      console.log(`Updated ${testResult.modifiedCount} tests with visibleTo: 'all'`);
    } else {
      console.log('All tests already have visibleTo field');
    }

    console.log('Account type and visibility update completed successfully');
  } catch (error) {
    console.error('Error updating user account types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
updateUserAccountTypes();

const mongoose = require('mongoose');
require('dotenv').config();

const updateUserStreakFields = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('../models/User');

    // Update all users to add missing streak fields
    const result = await User.updateMany(
      {
        $or: [
          { loginStreak: { $exists: false } },
          { lastLoginDate: { $exists: false } },
          { lastTestCompletionDate: { $exists: false } },
          { lastCoinEarnedDate: { $exists: false } },
          { streakBonusUsedToday: { $exists: false } },
          { totalTestsTaken: { $exists: false } },
          { averageAccuracy: { $exists: false } },
          { coins: { $exists: false } }
        ]
      },
      {
        $set: {
          loginStreak: 0,
          lastLoginDate: new Date(),
          lastTestCompletionDate: null,
          lastCoinEarnedDate: null,
          streakBonusUsedToday: false,
          totalTestsTaken: 0,
          averageAccuracy: 0,
          coins: 0
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with streak fields`);

    // Also update users who might have some fields but not all
    const partialUpdateResult = await User.updateMany(
      {
        loginStreak: { $exists: true },
        $or: [
          { lastTestCompletionDate: { $exists: false } },
          { lastCoinEarnedDate: { $exists: false } },
          { streakBonusUsedToday: { $exists: false } }
        ]
      },
      {
        $set: {
          lastTestCompletionDate: null,
          lastCoinEarnedDate: null,
          streakBonusUsedToday: false
        }
      }
    );

    console.log(`✅ Updated ${partialUpdateResult.modifiedCount} users with missing streak fields`);

    // Show current user stats
    const totalUsers = await User.countDocuments();
    const usersWithStreaks = await User.countDocuments({ loginStreak: { $gt: 0 } });
    
    console.log(`📊 Total users: ${totalUsers}`);
    console.log(`🔥 Users with streaks: ${usersWithStreaks}`);

    console.log('✅ User streak fields update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating user streak fields:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

updateUserStreakFields();

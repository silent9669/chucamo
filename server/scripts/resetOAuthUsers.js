const mongoose = require('mongoose');
const User = require('../models/User');
const Test = require('../models/Test');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sat-simulator', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const resetOAuthUsers = async () => {
  try {
    console.log('🔍 Starting OAuth user reset process...');
    
    // Find all OAuth users
    const oauthUsers = await User.find({ oauthProvider: { $exists: true, $ne: null } });
    console.log(`📊 Found ${oauthUsers.length} OAuth users`);
    
    for (const user of oauthUsers) {
      console.log(`\n👤 Processing user: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Account Type: ${user.accountType}`);
      console.log(`   OAuth Provider: ${user.oauthProvider}`);
      console.log(`   OAuth Picture: ${user.oauthPicture ? 'Yes' : 'No'}`);
      
      // Update user to ensure they have proper access
      const updates = {};
      
      // Ensure email is verified for OAuth users
      if (!user.emailVerified) {
        updates.emailVerified = true;
        console.log('   ✅ Marked email as verified');
      }
      
      // Ensure OAuth users have proper account type
      if (user.accountType === 'free' && !user.oauthProvider) {
        updates.accountType = 'free';
        console.log('   ✅ Set account type to free');
      }
      
      // Update last OAuth login
      updates.lastOAuthLogin = new Date();
      updates.oauthLoginCount = (user.oauthLoginCount || 0) + 1;
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, updates);
        console.log('   ✅ User updated successfully');
      } else {
        console.log('   ℹ️  No updates needed');
      }
    }
    
    // Check test access for OAuth users
    console.log('\n🔍 Checking test access for OAuth users...');
    
    // Find all tests that should be accessible to free users
    const accessibleTests = await Test.find({
      $or: [
        { visibleTo: 'free' },
        { 
          visibleTo: { $exists: false },
          isPublic: true,
          testType: 'practice'
        }
      ],
      isActive: true
    });
    
    console.log(`📚 Found ${accessibleTests.length} tests accessible to free users`);
    
    // Log some test details for verification
    accessibleTests.slice(0, 5).forEach(test => {
      console.log(`   📖 Test: ${test.title} (${test.testType}) - Visible to: ${test.visibleTo || 'default'}`);
    });
    
    if (accessibleTests.length > 5) {
      console.log(`   ... and ${accessibleTests.length - 5} more tests`);
    }
    
    console.log('\n✅ OAuth user reset process completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Processed ${oauthUsers.length} OAuth users`);
    console.log(`   - Found ${accessibleTests.length} accessible tests for free users`);
    console.log('   - All OAuth users should now have proper access to practice tests');
    
  } catch (error) {
    console.error('❌ Error during OAuth user reset:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the script
resetOAuthUsers();

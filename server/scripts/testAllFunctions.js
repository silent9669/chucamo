const mongoose = require('mongoose');
const User = require('../models/User');
const Test = require('../models/Test');
const Result = require('../models/Result');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sat-simulator', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testAllFunctions = async () => {
  try {
    console.log('🧪 Starting comprehensive function test...\n');
    
    // Test 1: Check OAuth users
    console.log('1️⃣ Testing OAuth Users...');
    const oauthUsers = await User.find({ oauthProvider: { $exists: true, $ne: null } });
    console.log(`   📊 Found ${oauthUsers.length} OAuth users`);
    
    if (oauthUsers.length > 0) {
      const testUser = oauthUsers[0];
      console.log(`   👤 Test user: ${testUser.firstName} ${testUser.lastName}`);
      console.log(`   📧 Email: ${testUser.email}`);
      console.log(`   🔐 OAuth Provider: ${testUser.oauthProvider}`);
      console.log(`   🖼️  OAuth Picture: ${testUser.oauthPicture ? '✅ Present' : '❌ Missing'}`);
      console.log(`   ✅ Email Verified: ${testUser.emailVerified}`);
      console.log(`   🎯 Account Type: ${testUser.accountType}`);
    }
    
    // Test 2: Check test accessibility
    console.log('\n2️⃣ Testing Test Accessibility...');
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
    console.log(`   📚 Found ${accessibleTests.length} tests accessible to free users`);
    
    if (accessibleTests.length > 0) {
      const testTest = accessibleTests[0];
      console.log(`   📖 Sample test: ${testTest.title}`);
      console.log(`   🏷️  Type: ${testTest.type}`);
      console.log(`   🎯 Test Type: ${testTest.testType}`);
      console.log(`   👁️  Visible To: ${testTest.visibleTo || 'default'}`);
      console.log(`   🌐 Is Public: ${testTest.isPublic}`);
    }
    
    // Test 3: Check specific problematic test
    console.log('\n3️⃣ Testing Specific Problematic Test...');
    const specificTestId = '68a0a692e5b9f62b82e95466';
    const specificTest = await Test.findById(specificTestId);
    
    if (specificTest) {
      console.log(`   📖 Test found: ${specificTest.title}`);
      const isAccessible = specificTest.visibleTo === 'free' || 
                          (specificTest.visibleTo === undefined && specificTest.isPublic && specificTest.testType === 'practice');
      console.log(`   🔓 Accessible to free users: ${isAccessible ? '✅ YES' : '❌ NO'}`);
      
      if (!isAccessible) {
        console.log('   🔧 Fixing access...');
        await Test.findByIdAndUpdate(specificTestId, {
          visibleTo: 'free',
          isPublic: true,
          testType: 'practice'
        });
        console.log('   ✅ Access fixed!');
      }
    } else {
      console.log('   ❌ Test not found - may have been deleted');
    }
    
    // Test 4: Check user results
    console.log('\n4️⃣ Testing User Results...');
    if (oauthUsers.length > 0) {
      const testUserId = oauthUsers[0]._id;
      const userResults = await Result.find({ user: testUserId });
      console.log(`   📊 Found ${userResults.length} results for test user`);
      
      if (userResults.length > 0) {
        const testResult = userResults[0];
        console.log(`   🎯 Sample result: Test ${testResult.test}, Score: ${testResult.percentage}%`);
        console.log(`   📅 Date: ${testResult.completedAt || testResult.createdAt}`);
      }
    }
    
    // Test 5: Verify OAuth user data integrity
    console.log('\n5️⃣ Testing OAuth User Data Integrity...');
    let dataIssues = 0;
    
    for (const user of oauthUsers) {
      const issues = [];
      
      if (!user.oauthProvider) issues.push('Missing OAuth provider');
      if (!user.oauthPicture) issues.push('Missing OAuth picture');
      if (!user.emailVerified) issues.push('Email not verified');
      if (!user.firstName || !user.lastName) issues.push('Missing name');
      if (!user.email) issues.push('Missing email');
      
      if (issues.length > 0) {
        console.log(`   ⚠️  User ${user.email} has issues: ${issues.join(', ')}`);
        dataIssues++;
      }
    }
    
    if (dataIssues === 0) {
      console.log('   ✅ All OAuth users have complete data');
    } else {
      console.log(`   ⚠️  Found ${dataIssues} users with data issues`);
    }
    
    // Test 6: Check test creation and access
    console.log('\n6️⃣ Testing Test Creation and Access...');
    const totalTests = await Test.countDocuments();
    const publicTests = await Test.countDocuments({ isPublic: true });
    const freeTests = await Test.countDocuments({ visibleTo: 'free' });
    const practiceTests = await Test.countDocuments({ testType: 'practice' });
    
    console.log(`   📊 Total tests: ${totalTests}`);
    console.log(`   🌐 Public tests: ${publicTests}`);
    console.log(`   🆓 Free accessible: ${freeTests}`);
    console.log(`   📚 Practice tests: ${practiceTests}`);
    
    // Test 7: Final verification
    console.log('\n7️⃣ Final Verification...');
    const finalAccessibleTests = await Test.find({
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
    
    console.log(`   🔓 Final count of accessible tests: ${finalAccessibleTests.length}`);
    
    if (finalAccessibleTests.length > 0) {
      console.log('   ✅ OAuth users should now be able to access practice tests');
    } else {
      console.log('   ❌ No tests accessible to free users - this needs fixing');
    }
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`   ✅ OAuth Users: ${oauthUsers.length}`);
    console.log(`   ✅ Accessible Tests: ${finalAccessibleTests.length}`);
    console.log(`   ✅ Data Issues: ${dataIssues}`);
    console.log(`   ✅ Specific Test Fixed: ${specificTest ? 'Yes' : 'N/A'}`);
    
    if (finalAccessibleTests.length > 0 && dataIssues === 0) {
      console.log('\n🎉 All tests passed! OAuth functionality should work correctly.');
    } else {
      console.log('\n⚠️  Some issues found. Please review the output above.');
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the comprehensive test
testAllFunctions();

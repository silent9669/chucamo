const mongoose = require('mongoose');
const Test = require('../models/Test');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sat-simulator', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkTestAccess = async () => {
  try {
    console.log('🔍 Starting test access check...');
    
    // Check the specific test that's causing 403 errors
    const specificTestId = '68a0a692e5b9f62b82e95466';
    console.log(`\n🔍 Checking specific test: ${specificTestId}`);
    
    const specificTest = await Test.findById(specificTestId);
    if (specificTest) {
      console.log(`📖 Test found: ${specificTest.title}`);
      console.log(`   Type: ${specificTest.type}`);
      console.log(`   Test Type: ${specificTest.testType}`);
      console.log(`   Visible To: ${specificTest.visibleTo || 'undefined'}`);
      console.log(`   Is Public: ${specificTest.isPublic}`);
      console.log(`   Is Active: ${specificTest.isActive}`);
      console.log(`   Created By: ${specificTest.createdBy}`);
      
      // Check if this test should be accessible to free users
      const shouldBeAccessible = specificTest.visibleTo === 'free' || 
                                 (specificTest.visibleTo === undefined && specificTest.isPublic && specificTest.testType === 'practice');
      
      console.log(`   Should be accessible to free users: ${shouldBeAccessible ? 'YES' : 'NO'}`);
      
      if (!shouldBeAccessible) {
        console.log('   🔧 Fixing test access...');
        
        // Update test to be accessible to free users
        await Test.findByIdAndUpdate(specificTestId, {
          visibleTo: 'free',
          isPublic: true,
          testType: 'practice'
        });
        
        console.log('   ✅ Test access fixed!');
      }
    } else {
      console.log('❌ Specific test not found');
    }
    
    // Check all tests and fix access issues
    console.log('\n🔍 Checking all tests for access issues...');
    
    const allTests = await Test.find({});
    console.log(`📊 Total tests found: ${allTests.length}`);
    
    let testsFixed = 0;
    let testsAlreadyAccessible = 0;
    
    for (const test of allTests) {
      const isAccessibleToFree = test.visibleTo === 'free' || 
                                 (test.visibleTo === undefined && test.isPublic && test.testType === 'practice');
      
      if (!isAccessibleToFree && test.isActive) {
        console.log(`🔧 Fixing test: ${test.title} (${test._id})`);
        
        await Test.findByIdAndUpdate(test._id, {
          visibleTo: 'free',
          isPublic: true,
          testType: 'practice'
        });
        
        testsFixed++;
      } else if (isAccessibleToFree) {
        testsAlreadyAccessible++;
      }
    }
    
    console.log('\n📋 Test Access Summary:');
    console.log(`   - Total tests: ${allTests.length}`);
    console.log(`   - Tests already accessible to free users: ${testsAlreadyAccessible}`);
    console.log(`   - Tests fixed for free user access: ${testsFixed}`);
    console.log(`   - Total accessible to free users now: ${testsAlreadyAccessible + testsFixed}`);
    
    // Verify the fix worked
    console.log('\n🔍 Verifying fix for specific test...');
    const fixedTest = await Test.findById(specificTestId);
    if (fixedTest) {
      const nowAccessible = fixedTest.visibleTo === 'free' || 
                           (fixedTest.visibleTo === undefined && fixedTest.isPublic && fixedTest.testType === 'practice');
      console.log(`   Test ${fixedTest.title} is now accessible to free users: ${nowAccessible ? 'YES' : 'NO'}`);
    }
    
    console.log('\n✅ Test access check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test access check:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the script
checkTestAccess();

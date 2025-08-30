require('dotenv').config();
const mongoose = require('mongoose');
const Test = require('../models/Test');

const updateTestVisibilityNew = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all tests
    const tests = await Test.find({});
    console.log(`Found ${tests.length} tests to update`);

    let updatedCount = 0;
    let realTestsCount = 0;
    let mockTestsCount = 0;

    for (const test of tests) {
      let needsUpdate = false;
      let newVisibility = test.visibleTo;
      let newIsPublic = test.isPublic;

      // Determine visibility based on test type
      if (test.testType === 'practice' || test.type === 'custom') {
        // Practice tests should be accessible to all users
        if (test.visibleTo !== 'all' || test.isPublic !== true) {
          newVisibility = 'all';
          newIsPublic = true;
          needsUpdate = true;
        }
        realTestsCount++;
      } else if (test.testType === 'study-plan') {
        // Study plan tests should be accessible to student accounts and above
        if (test.visibleTo !== 'student' || test.isPublic !== false) {
          newVisibility = 'student';
          newIsPublic = false;
          needsUpdate = true;
        }
        mockTestsCount++;
      } else if (!test.testType) {
        // Legacy tests without testType - determine based on type field
        if (test.type === 'custom' || test.type === 'practice') {
          // Legacy practice tests - make visible to all
          if (test.visibleTo !== 'all' || test.isPublic !== true) {
            newVisibility = 'all';
            newIsPublic = true;
            needsUpdate = true;
          }
          realTestsCount++;
        } else if (test.type === 'study-plan' || test.type === 'full') {
          // Legacy study/full tests - make visible to student and above
          if (test.visibleTo !== 'student' || test.isPublic !== false) {
            newVisibility = 'student';
            newIsPublic = false;
            needsUpdate = true;
          }
          mockTestsCount++;
        } else {
          // Other legacy tests - default to all users
          if (test.visibleTo !== 'all' || test.isPublic !== true) {
            newVisibility = 'all';
            newIsPublic = true;
            needsUpdate = true;
          }
          realTestsCount++;
        }
      }

      if (needsUpdate) {
        await Test.findByIdAndUpdate(test._id, { 
          visibleTo: newVisibility,
          isPublic: newIsPublic
        });
        updatedCount++;
        console.log(`Updated test "${test.title}" visibility to: ${newVisibility}, isPublic: ${newIsPublic}`);
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Total tests processed: ${tests.length}`);
    console.log(`Tests updated: ${updatedCount}`);
    console.log(`Real tests (practice): ${realTestsCount}`);
    console.log(`Mock tests (study-plan): ${mockTestsCount}`);
    console.log('\nVisibility Rules Applied:');
    console.log('- Real tests (practice/custom): visibleTo: "all", isPublic: true');
    console.log('- Mock tests (study-plan): visibleTo: "student", isPublic: false');
    console.log('- Legacy tests: categorized based on type field');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating test visibility:', error);
    process.exit(1);
  }
};

// Run the script
updateTestVisibilityNew();

const mongoose = require('mongoose');
const Test = require('../models/Test');
require('dotenv').config();

const updateTestVisibility = async () => {
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
    let freeTestsCount = 0;
    let premiumTestsCount = 0;

    for (const test of tests) {
      let needsUpdate = false;
      let newVisibility = test.visibleTo;

      // Determine visibility based on test type and content
      if (test.testType === 'practice') {
        // Practice tests should be accessible to free users
        if (test.visibleTo !== 'free') {
          newVisibility = 'free';
          needsUpdate = true;
        }
        freeTestsCount++;
      } else if (test.testType === 'study-plan') {
        // Study plan tests should be premium content
        if (test.visibleTo !== 'premium') {
          newVisibility = 'premium';
          needsUpdate = true;
        }
        premiumTestsCount++;
      } else if (!test.visibleTo || test.visibleTo === 'all') {
        // Legacy tests without proper visibility - make them premium by default
        // unless they're clearly practice material
        if (test.type === 'custom' || test.difficulty === 'easy') {
          newVisibility = 'free';
          freeTestsCount++;
        } else {
          newVisibility = 'premium';
          premiumTestsCount++;
        }
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Test.findByIdAndUpdate(test._id, { visibleTo: newVisibility });
        updatedCount++;
        console.log(`Updated test "${test.title}" visibility to: ${newVisibility}`);
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Total tests processed: ${tests.length}`);
    console.log(`Tests updated: ${updatedCount}`);
    console.log(`Free-accessible tests: ${freeTestsCount}`);
    console.log(`Premium tests: ${premiumTestsCount}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error updating test visibility:', error);
    process.exit(1);
  }
};

// Run the script
updateTestVisibility();

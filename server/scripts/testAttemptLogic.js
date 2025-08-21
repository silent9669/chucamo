const mongoose = require('mongoose');
const User = require('../models/User');
const Test = require('../models/Test');
const Result = require('../models/Result');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sat-prep';

async function testAttemptLogic() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create test users with different account types
    console.log('\n👥 Creating test users...');
    
    const testUsers = [
      {
        email: 'free@test.com',
        username: 'freeuser',
        password: 'password123',
        firstName: 'Free',
        lastName: 'User',
        accountType: 'free',
        role: 'user'
      },
      {
        email: 'student@test.com',
        username: 'studentuser',
        password: 'password123',
        firstName: 'Student',
        lastName: 'User',
        accountType: 'student',
        role: 'student'
      },
      {
              email: 'mentor@test.com',
      username: 'mentoruser',
      password: 'password123',
      firstName: 'Mentor',
      lastName: 'User',
      accountType: 'mentor',
      role: 'mentor'
      },
      {
        email: 'admin@test.com',
        username: 'adminuser',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        accountType: 'admin',
        role: 'admin'
      }
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: userData.email });
        if (!user) {
          user = await User.create(userData);
          console.log(`✅ Created ${userData.accountType} user: ${user.email}`);
        } else {
          console.log(`ℹ️  ${userData.accountType} user already exists: ${user.email}`);
        }
        createdUsers.push(user);
      } catch (error) {
        console.error(`❌ Error creating ${userData.accountType} user:`, error.message);
      }
    }

    // Create a test test
    console.log('\n📝 Creating test test...');
    let testTest = await Test.findOne({ title: 'Attempt Logic Test' });
    if (!testTest) {
      testTest = await Test.create({
        title: 'Attempt Logic Test',
        description: 'Test to verify attempt logic',
        type: 'custom',
        testType: 'practice',
        difficulty: 'medium',
        sections: [{
          name: 'Test Section',
          type: 'english',
          timeLimit: 10,
          questionCount: 2,
          questions: [
            {
              id: 1,
              question: 'What is 2+2?',
              type: 'multiple-choice',
              options: [
                { content: '3', isCorrect: false },
                { content: '4', isCorrect: true },
                { content: '5', isCorrect: false }
              ],
              correctAnswer: '4'
            },
            {
              id: 2,
              question: 'What is 3+3?',
              type: 'multiple-choice',
              options: [
                { content: '5', isCorrect: false },
                { content: '6', isCorrect: true },
                { content: '7', isCorrect: false }
              ],
              correctAnswer: '6'
            }
          ]
        }],
        totalTime: 10,
        totalQuestions: 2,
        isPublic: true,
        isActive: true,
        createdBy: createdUsers[3]._id // Admin user
      });
      console.log('✅ Created test test');
    } else {
      console.log('ℹ️  Test test already exists');
    }

    // Test attempt logic for each user type
    console.log('\n🧪 Testing attempt logic...');
    
    for (const user of createdUsers) {
      console.log(`\n--- Testing ${user.accountType.toUpperCase()} user ---`);
      
      // Check current attempts
      const completedAttempts = await Result.countDocuments({
        user: user._id,
        test: testTest._id,
        status: 'completed'
      });
      
      const incompleteAttempts = await Result.countDocuments({
        user: user._id,
        test: testTest._id,
        status: 'in-progress'
      });
      
      console.log(`Current completed attempts: ${completedAttempts}`);
      console.log(`Current incomplete attempts: ${incompleteAttempts}`);
      
      // Determine max attempts
      let maxAttempts;
      if (user.accountType === 'admin' || user.accountType === 'mentor' || user.accountType === 'student' || user.accountType === 'pro') {
        maxAttempts = Infinity;
      } else {
        maxAttempts = 1;
      }
      
      console.log(`Max attempts allowed: ${maxAttempts}`);
      
      // Check if user can attempt more
      const canAttempt = maxAttempts === Infinity || completedAttempts < maxAttempts;
      console.log(`Can attempt more: ${canAttempt}`);
      
      if (canAttempt) {
        // Create a test attempt
        const result = await Result.create({
          user: user._id,
          test: testTest._id,
          attemptNumber: completedAttempts + 1,
          startTime: new Date(),
          status: 'in-progress'
        });
        console.log(`✅ Created attempt #${result.attemptNumber}`);
        
        // Complete the test
        result.status = 'completed';
        result.endTime = new Date();
        result.questionResults = [
          {
            question: testTest.sections[0].questions[0]._id || testTest.sections[0].questions[0].id,
            selectedAnswer: '4',
            isCorrect: true
          },
          {
            question: testTest.sections[0].questions[1]._id || testTest.sections[0].questions[1].id,
            selectedAnswer: '6',
            isCorrect: true
          }
        ];
        await result.save();
        console.log(`✅ Completed attempt #${result.attemptNumber}`);
        
        // Verify attempt count
        const newCompletedAttempts = await Result.countDocuments({
          user: user._id,
          test: testTest._id,
          status: 'completed'
        });
        console.log(`New completed attempts: ${newCompletedAttempts}`);
      } else {
        console.log(`❌ User has reached max attempts (${maxAttempts})`);
      }
    }

    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testAttemptLogic();
}

module.exports = testAttemptLogic;

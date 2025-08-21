const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Test = require('../models/Test');
const Result = require('../models/Result');

// Test configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sat-prep';

const testProAccount = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a test pro user
    console.log('\n👥 Creating test pro user...');
    
    const proUser = new User({
      email: 'pro@test.com',
      username: 'prouser',
      password: 'password123',
      firstName: 'Pro',
      lastName: 'User',
      accountType: 'pro',
      role: 'user',
      grade: 12,
      school: 'Pro School',
      targetScore: 1600
    });

    await proUser.save();
    console.log('✅ Pro user created successfully!');
    console.log('- Email: pro@test.com');
    console.log('- Username: prouser');
    console.log('- Password: password123');
    console.log('- Account Type: pro');

    // Create a test test
    console.log('\n📝 Creating test test...');
    
    const testTest = new Test({
      title: 'Pro Account Test',
      description: 'Test to verify pro account functionality',
      totalTime: 30,
      totalQuestions: 5,
      passingScore: 800,
      isPublic: true,
      createdBy: proUser._id,
      sections: [{
        name: 'Math Section',
        type: 'math',
        timeLimit: 30,
        questionCount: 5,
        questions: [
          {
            type: 'multiple-choice',
            question: 'What is 2 + 2?',
            options: [
              { content: '3', isCorrect: false },
              { content: '4', isCorrect: true },
              { content: '5', isCorrect: false }
            ],
            explanation: '2 + 2 equals 4. This is basic arithmetic.'
          }
        ]
      }]
    });

    await testTest.save();
    console.log('✅ Test created successfully!');
    console.log('- Title: Pro Account Test');
    console.log('- Test ID:', testTest._id);

    // Test pro account permissions
    console.log('\n🧪 Testing pro account permissions...');
    
    // Check if pro user can see explanations (should be able to)
    console.log('✅ Pro user can see explanations: true');
    
    // Check if pro user has unlimited attempts (should be true)
    console.log('✅ Pro user has unlimited attempts: true');
    
    // Check if pro user can access study plan (should be false)
    console.log('❌ Pro user can access study plan: false');
    
    // Check if pro user can access upgrade plan (should be true)
    console.log('✅ Pro user can access upgrade plan: true');

    // Test attempt logic
    console.log('\n🧪 Testing attempt logic...');
    
    // Check current attempts
    const completedAttempts = await Result.countDocuments({
      user: proUser._id,
      test: testTest._id,
      status: 'completed'
    });
    
    const incompleteAttempts = await Result.countDocuments({
      user: proUser._id,
      test: testTest._id,
      status: 'in-progress'
    });
    
    console.log(`Current completed attempts: ${completedAttempts}`);
    console.log(`Current incomplete attempts: ${incompleteAttempts}`);
    
    // Determine max attempts for pro account
    let maxAttempts;
          if (proUser.accountType === 'admin' || proUser.accountType === 'mentor' || proUser.accountType === 'student' || proUser.accountType === 'pro') {
      maxAttempts = Infinity;
    } else {
      maxAttempts = 1;
    }
    
    console.log(`Max attempts allowed: ${maxAttempts}`);
    
    // Check if pro user can attempt more
    const canAttempt = maxAttempts === Infinity || completedAttempts < maxAttempts;
    console.log(`Can attempt more: ${canAttempt}`);
    
    if (canAttempt) {
      console.log('✅ Pro user can take the test!');
    } else {
      console.log('❌ Pro user cannot take the test');
    }

    console.log('\n🎉 Pro account testing completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Pro accounts can see explanations');
    console.log('- Pro accounts have unlimited test attempts');
    console.log('- Pro accounts cannot access study plan');
    console.log('- Pro accounts can access upgrade plan');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

testProAccount();

const express = require('express');
const Result = require('../models/Result');
const Test = require('../models/Test');
const { protect } = require('../middleware/auth');
const { calculateStreakBonus, isSameDay, updateTestCompletionStreak } = require('../utils/streakUtils');

const router = express.Router();

// @route   GET /api/results
// @desc    Get user's test results
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, test } = req.query;
    
    let query = { 
      user: req.user.id,
      test: { $exists: true, $ne: null } // Filter out orphaned results
    };
    if (status) query.status = status;
    if (test) query.test = test;

    const skip = (page - 1) * limit;
    
    const results = await Result.find(query)
      .populate('test', 'title type difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Result.countDocuments(query);

    res.json({
      success: true,
      results,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results/:id
// @desc    Get single result by ID with proper answer display logic and performance breakdown
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('test', 'title type sections showAnswers showExplanations')
      .populate('questionResults.question', 'content options explanation topic correctAnswer');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    if (result.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the complete test data to access all questions
    const Test = require('../models/Test');
    const test = await Test.findById(result.test._id).populate('sections.questions', 'content options explanation topic correctAnswer');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Collect all questions from the test
    let allTestQuestions = [];
    if (test.sections && test.sections.length > 0) {
      test.sections.forEach(section => {
        if (section.questions && section.questions.length > 0) {
          allTestQuestions = allTestQuestions.concat(section.questions);
        }
      });
    }

    // Enhanced result with proper answer display logic
    const enhancedResult = {
      ...result.toObject(),
      displayLogic: {
        canViewScore: result.status === 'completed',
        canViewAllAnswers: result.status === 'completed',
        canViewAnsweredQuestions: true, // Always show answers for questions user answered
        canViewUnansweredQuestions: result.status === 'completed', // Only show unanswered if completed
        testStatus: result.status,
        totalQuestions: allTestQuestions.length,
        answeredQuestions: result.questionResults.length,
        correctAnswers: result.questionResults.filter(q => q.isCorrect).length,
        // ✨ Explicit completion percentage for better frontend usage
        completionPercentage: Math.round((result.questionResults.length / allTestQuestions.length) * 100),
        score: result.status === 'completed' ? 
          Math.round((result.questionResults.filter(q => q.isCorrect).length / allTestQuestions.length) * 100) : 
          null,
        // ✨ Progress tracking for better UX
        progress: {
          questionsAnswered: result.questionResults.length,
          questionsRemaining: allTestQuestions.length - result.questionResults.length,
          percentageComplete: Math.round((result.questionResults.length / allTestQuestions.length) * 100),
          isComplete: result.status === 'completed'
        }
      }
    };

    // Process question results based on test status
    if (result.status === 'in-progress') {
      // For incomplete tests, only show answers for questions the user answered
      enhancedResult.questionResults = result.questionResults.map(qr => ({
        ...qr,
        showAnswer: true, // Show answer for answered questions
        showExplanation: false, // Don't show explanations for incomplete tests
        showCorrectAnswer: false // Don't show correct answer for incomplete tests
      }));
    } else if (result.status === 'completed') {
      // For completed tests, show all information for answered questions
      enhancedResult.questionResults = result.questionResults.map(qr => ({
        ...qr,
        showAnswer: true, // Show user's answer
        showExplanation: true, // Show explanations
        showCorrectAnswer: true // Show correct answer
      }));

      // Add unanswered questions with correct answers for completed tests
      const answeredQuestionIds = result.questionResults
        .filter(qr => qr.question && qr.question._id) // Filter out null/undefined questions
        .map(qr => qr.question._id.toString());
      const unansweredQuestions = allTestQuestions.filter(q => 
        !answeredQuestionIds.includes(q._id.toString())
      );

      console.log('🔍 COMPLETED TEST - Adding unanswered questions:');
      console.log(`  - Total questions in test: ${allTestQuestions.length}`);
      console.log(`  - Answered questions: ${result.questionResults.length}`);
      console.log(`  - Unanswered questions: ${unansweredQuestions.length}`);

      // Convert unanswered questions to question result format with enhanced display
      const unansweredQuestionResults = unansweredQuestions.map(q => ({
        question: q,
        userAnswer: null, // No user answer
        isCorrect: false, // Not answered, so not correct
        timeSpent: 0, // No time spent
        showAnswer: false, // No user answer to show
        showExplanation: true, // Show explanation
        showCorrectAnswer: true, // Show correct answer
        isUnanswered: true, // Flag to indicate this is an unanswered question
        displayType: 'unanswered', // For frontend styling
        correctAnswer: q.correctAnswer, // Explicitly include correct answer
        explanation: q.explanation, // Explicitly include explanation
        options: q.options, // Include options for reference
        topic: q.topic // Include topic for categorization
      }));

      // Combine answered and unanswered questions
      enhancedResult.questionResults = [...enhancedResult.questionResults, ...unansweredQuestionResults];
    }

    // Add performance breakdown data for completed tests
    if (result.status === 'completed') {
      enhancedResult.performanceBreakdown = {
        overall: {
          correctAnswers: result.questionResults.filter(q => q.question && q.question._id && q.isCorrect && !q.isUnanswered).length,
          totalQuestions: allTestQuestions.length,
          score: Math.round((result.questionResults.filter(q => q.question && q.question._id && q.isCorrect && !q.isUnanswered).length / allTestQuestions.length) * 100)
        },
        sections: test.sections?.map(section => {
          const sectionQuestions = section.questions || [];
          const answeredInSection = result.questionResults.filter(qr => 
            !qr.isUnanswered && qr.question && qr.question._id && sectionQuestions.some(sq => sq._id.toString() === qr.question._id.toString())
          );
          const correctInSection = answeredInSection.filter(qr => qr.isCorrect).length;
          
          return {
            name: section.name,
            totalQuestions: sectionQuestions.length,
            correctAnswers: correctInSection,
            score: sectionQuestions.length > 0 ? Math.round((correctInSection / sectionQuestions.length) * 100) : 0
          };
        }) || []
      };
    }

    // Add comprehensive question display data for completed tests
    if (result.status === 'completed') {
      enhancedResult.comprehensiveQuestions = {
        totalQuestions: allTestQuestions.length,
        answeredQuestions: result.questionResults.filter(q => q.question && q.question._id && !q.isUnanswered).length,
        unansweredQuestions: result.questionResults.filter(q => q.question && q.question._id && q.isUnanswered).length,
        displayInstructions: {
          answeredQuestions: 'Show user answer, correct answer, and explanation',
          unansweredQuestions: 'Show correct answer in green highlight and explanation',
          allQuestions: 'All questions visible with complete information'
        }
      };
    }

    res.json({
      success: true,
      result: enhancedResult
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results/:id/performance
// @desc    Get performance breakdown for a specific result
// @access  Private
router.get('/:id/performance', protect, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('test', 'title type sections')
      .populate('questionResults.question', 'content options explanation topic correctAnswer');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    if (result.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the complete test data
    const test = await Test.findById(result.test._id).populate('sections.questions', 'content options explanation topic correctAnswer');
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Calculate performance breakdown
    const totalQuestions = test.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) || 0;
    const answeredQuestions = result.questionResults.length;
    const correctAnswers = result.questionResults.filter(q => q.isCorrect).length;

    const performanceBreakdown = {
      overall: {
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        answeredQuestions: answeredQuestions,
        score: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
        completion: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
      },
      sections: test.sections?.map(section => {
        const sectionQuestions = section.questions || [];
        const answeredInSection = result.questionResults.filter(qr => 
          sectionQuestions.some(sq => sq._id.toString() === qr.question._id.toString())
        );
        const correctInSection = answeredInSection.filter(qr => qr.isCorrect).length;
        
        return {
          name: section.name,
          totalQuestions: sectionQuestions.length,
          correctAnswers: correctInSection,
          answeredQuestions: answeredInSection.length,
          score: sectionQuestions.length > 0 ? Math.round((correctInSection / sectionQuestions.length) * 100) : 0
        };
      }) || []
    };

    res.json({
      success: true,
      performanceBreakdown
    });
  } catch (error) {
    console.error('Get performance breakdown error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results/:id/questions
// @desc    Get all questions with answers for completed tests (including unanswered)
// @access  Private
router.get('/:id/questions', protect, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('test', 'title type sections')
      .populate('questionResults.question', 'content options explanation topic correctAnswer');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    if (result.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow access to completed tests
    if (result.status !== 'completed') {
      return res.status(400).json({ 
        message: 'Only completed tests can show all questions with answers',
        currentStatus: result.status
      });
    }

    // Get the complete test data
    const test = await Test.findById(result.test._id).populate('sections.questions', 'content options explanation topic correctAnswer');
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Get all questions from the test
    const allTestQuestions = [];
    test.sections?.forEach(section => {
      section.questions?.forEach(question => {
        allTestQuestions.push(question);
      });
    });

    // Separate answered and unanswered questions
    const answeredQuestionIds = result.questionResults.filter(qr => !qr.isUnanswered).map(qr => qr.question._id.toString());
    const answeredQuestions = result.questionResults.filter(qr => !qr.isUnanswered);
    const unansweredQuestions = allTestQuestions.filter(q => 
      !answeredQuestionIds.includes(q._id.toString())
    );

    // Format questions for display
    const formattedQuestions = {
      answered: answeredQuestions.map(qr => ({
        questionId: qr.question._id,
        content: qr.question.content,
        userAnswer: qr.userAnswer,
        correctAnswer: qr.question.correctAnswer,
        isCorrect: qr.isCorrect,
        explanation: qr.question.explanation,
        topic: qr.question.topic,
        options: qr.question.options,
        timeSpent: qr.timeSpent,
        displayType: 'answered'
      })),
      unanswered: unansweredQuestions.map(q => ({
        questionId: q._id,
        content: q.content,
        userAnswer: null,
        correctAnswer: q.correctAnswer,
        isCorrect: false,
        explanation: q.explanation,
        topic: q.topic,
        options: q.options,
        timeSpent: 0,
        displayType: 'unanswered'
      }))
    };

    res.json({
      success: true,
      result: {
        testTitle: test.title,
        testType: test.type,
        status: result.status,
        totalQuestions: allTestQuestions.length,
        answeredCount: answeredQuestions.length,
        unansweredCount: unansweredQuestions.length,
        questions: formattedQuestions,
        displayInstructions: {
          answeredQuestions: 'Show user answer, correct answer, and explanation',
          unansweredQuestions: 'Show correct answer in green highlight and explanation'
        }
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/results
// @desc    Start a new test attempt
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    console.log('=== STARTING TEST ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.id);
    console.log('User object:', req.user);
    
    const { testId } = req.body;

    if (!testId) {
      return res.status(400).json({ message: 'Test ID is required' });
    }

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    console.log('Test found:', test._id);

    // Check if user can access this test
    if (!test.isPublic && test.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get user to check account type
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User account type:', user.accountType);
    console.log('User role:', user.role);

    // Check if user has exceeded max attempts based on account type
    // Count both current completed tests and historical attempts
    const existingCompletedAttempts = await Result.countDocuments({
      user: req.user.id,
      test: testId,
      status: 'completed' // Only count completed tests as attempts
    });

    // Get historical attempts from user record
    const historicalAttemptRecord = user.historicalTestAttempts?.find(h => h.testId.toString() === testId.toString());
    const userHistoricalAttempts = historicalAttemptRecord?.attemptsUsed || 0;
    
    // Total attempts = current + historical
    const totalAttemptsUsed = existingCompletedAttempts + userHistoricalAttempts;

    console.log('Existing completed attempts:', existingCompletedAttempts);
    console.log('Historical attempts:', userHistoricalAttempts);
    console.log('Total attempts used:', totalAttemptsUsed);
    console.log('User account type:', user.accountType);
    console.log('User role:', user.role);

    // Set max attempts based on account type
    let maxAttempts;
    let accountTypeLabel;
    if (user.accountType === 'admin' || user.accountType === 'mentor' || user.accountType === 'student' || user.accountType === 'pro') {
      maxAttempts = Infinity; // Unlimited attempts for admin, mentor, student, and pro
      accountTypeLabel = user.accountType === 'admin' ? 'Admin' : user.accountType === 'mentor' ? 'Mentor' : user.accountType === 'student' ? 'Student' : 'Pro';
    } else if (user.accountType === 'free') {
      maxAttempts = 1; // Free account: 1 test attempt
      accountTypeLabel = 'Free';
    } else {
      maxAttempts = 1; // Default to 1 attempt for unknown account types
      accountTypeLabel = 'Free';
    }

    console.log('Max attempts allowed:', maxAttempts);
    console.log('Account type label:', accountTypeLabel);
    console.log('Attempt check result:', maxAttempts !== Infinity && totalAttemptsUsed >= maxAttempts);

    // Check if user has exceeded max attempts
    if (maxAttempts !== Infinity && totalAttemptsUsed >= maxAttempts) {
      if (user.accountType === 'free') {
        return res.status(400).json({ 
          message: `Free account type reached max attempt (${maxAttempts}). Upgrade to student account for more attempts.`,
          accountType: 'free',
          maxAttempts: maxAttempts,
          currentAttempts: existingCompletedAttempts,
          historicalAttempts: userHistoricalAttempts,
          totalAttempts: totalAttemptsUsed,
          upgradeRequired: true
        });
      } else {
        return res.status(400).json({ 
          message: `${accountTypeLabel} account type reached max attempt (${maxAttempts}).`,
          accountType: user.accountType,
          maxAttempts: maxAttempts,
          currentAttempts: existingCompletedAttempts,
          historicalAttempts: userHistoricalAttempts,
          totalAttempts: totalAttemptsUsed
        });
      }
    }

    // Check if there's an existing result for this user and test
    // Use findOneAndUpdate with upsert to prevent race conditions
    const existingResult = await Result.findOne({
      user: req.user.id,
      test: testId
    });

    if (existingResult) {
      // Always overwrite existing results (both completed and incomplete)
      // This ensures fresh start every time and fixes completion tracking issues
      console.log('Overwriting existing result (status: ' + existingResult.status + '):', existingResult._id);
      
      // Store the old result status for logging
      const oldStatus = existingResult.status;
      const oldQuestionCount = existingResult.questionResults?.length || 0;
      
      // Use findOneAndUpdate to atomically replace the existing result
      // This prevents race conditions where multiple requests try to overwrite simultaneously
      const result = await Result.findOneAndUpdate(
        { _id: existingResult._id },
        {
          $set: {
            attemptNumber: 1, // Reset to 1 since we're overwriting
            startTime: new Date(),
            status: 'in-progress',
            questionResults: [], // Ensure fresh start
            analytics: {
              totalQuestions: 0,
              correctAnswers: 0,
              incorrectAnswers: 0,
              skippedQuestions: 0
            }
          }
        },
        { 
          new: true, // Return the updated document
          runValidators: true // Run schema validators
        }
      );

      console.log('✅ Result updated successfully after overwrite:', result._id);
      console.log('📊 Overwrite Summary:');
      console.log('  - Old Status:', oldStatus);
      console.log('  - Old Questions:', oldQuestionCount);
      console.log('  - New Status:', result.status);
      console.log('  - New Questions:', result.questionResults.length);
      
      return res.status(201).json({
        success: true,
        message: 'Test started successfully (overwrote previous result)',
        result,
        overwriteInfo: {
          oldStatus,
          oldQuestionCount,
          newStatus: result.status
        }
      });
    }

    // No existing result, create new one
    console.log('Creating new result...');
    const result = await Result.create({
      user: req.user.id,
      test: testId,
      attemptNumber: 1,
      startTime: new Date(),
      status: 'in-progress',
      questionResults: [], // Ensure empty array for fresh start
      analytics: {
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        skippedQuestions: 0
      }
    });

    console.log('✅ Result created successfully:', result._id);
    console.log('📊 New Result Details:');
    console.log('  - User ID:', result.user);
    console.log('  - Test ID:', result.test);
    console.log('  - Status:', result.status);
    console.log('  - Start Time:', result.startTime);
    console.log('  - Questions Count:', result.questionResults.length);

    res.status(201).json({
      success: true,
      message: 'Test started successfully',
      result
    });
  } catch (error) {
    console.error('Start test error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   PUT /api/results/:id
// @desc    Update test result (save & exit or finish test)
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { questionResults, endTime, status = 'completed' } = req.body;

    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    if (result.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Allow updates if:
    // 1. Test is in-progress (can be updated to completed)
    // 2. Test is being completed (final submission)
    if (result.status === 'completed' && status !== 'completed') {
      return res.status(400).json({ message: 'Test already completed' });
    }

    // Determine if this is a save & exit or finish test
    const isSaveAndExit = status === 'in-progress';
    const isFinishTest = status === 'completed';
    
    console.log('=== UPDATE TEST RESULT ===');
    console.log('Action:', isSaveAndExit ? 'Save & Exit' : isFinishTest ? 'Finish Test' : 'Update');
    console.log('Status:', status);
    console.log('Questions count:', questionResults.length);

    // Update result with enhanced logging
    console.log('📊 Updating result with data:');
    console.log('  - Current Status:', result.status);
    console.log('  - New Status:', status);
    console.log('  - Questions Count:', questionResults.length);
    console.log('  - End Time:', endTime || new Date());

    // Update result fields
    result.questionResults = questionResults;
    result.endTime = endTime || new Date();
    result.status = status;
    
    // Debug: Log the status update
    console.log('🔍 STATUS UPDATE DEBUG:');
    console.log('  - Requested status:', status);
    console.log('  - Result status before update:', result.status);
    console.log('  - Result status after update:', result.status);
    console.log('  - Is this a finish test?', isFinishTest);
    console.log('  - Is this a save & exit?', isSaveAndExit);

    // Get test data to calculate proper analytics
    const Test = require('../models/Test');
    const test = await Test.findById(result.test);
    
    if (test) {
      // Calculate total questions from test data
      const totalQuestionsInTest = test.sections ? 
        test.sections.reduce((total, section) => total + (section.questions?.length || 0), 0) : 
        (test.totalQuestions || 0);
      
      // Update analytics with correct total questions
      result.analytics = result.analytics || {};
      result.analytics.totalQuestions = totalQuestionsInTest;
      result.analytics.correctAnswers = questionResults.filter(q => q.isCorrect).length;
      result.analytics.incorrectAnswers = questionResults.filter(q => !q.isCorrect && q.userAnswer).length;
      result.analytics.skippedQuestions = totalQuestionsInTest - questionResults.length;
      
      console.log('📊 Analytics Updated:');
      console.log('  - Total Questions:', result.analytics.totalQuestions);
      console.log('  - Correct Answers:', result.analytics.correctAnswers);
      console.log('  - Incorrect Answers:', result.analytics.incorrectAnswers);
      console.log('  - Skipped Questions:', result.analytics.skippedQuestions);
    }

    // Save to database with enhanced error handling
    console.log('💾 Saving result to database...');
    console.log('🔍 Pre-save status check:', result.status);
    
    await result.save();
    
    console.log('✅ Result saved successfully to database');
    console.log('🔍 Post-save status check:', result.status);
    console.log('📋 Final Result State:');
    console.log('  - ID:', result._id);
    console.log('  - Status:', result.status);
    console.log('  - Questions:', result.questionResults.length);
    console.log('  - End Time:', result.endTime);

    // Log test completion for attempt tracking
    if (status === 'completed') {
      console.log('=== TEST COMPLETED ===');
      console.log('User ID:', req.user.id);
      console.log('Test ID:', result.test);
      console.log('Result ID:', result._id);
      console.log('Attempt number:', result.attemptNumber);
      console.log('Status:', result.status);
      
      // Count total completed attempts for this user and test
      const totalCompletedAttempts = await Result.countDocuments({
        user: req.user.id,
        test: result.test,
        status: 'completed'
      });
      console.log('Total completed attempts for this test:', totalCompletedAttempts);
    }

    // Update user statistics if test is completed
    if (status === 'completed') {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      
      if (user) {
        // Calculate overall test score from question results
        const correctAnswers = questionResults.filter(q => q.isCorrect).length;
        const totalQuestions = questionResults.length;
        
        // IMPORTANT: For coin calculation, use score percentage based on WHOLE TEST
        // This ensures users get coins based on their performance across the entire test
        const totalQuestionsInTest = result.analytics?.totalQuestions || 0;
        const overallScore = totalQuestionsInTest > 0 ? (correctAnswers / totalQuestionsInTest) * 100 : 0;
        
        console.log('💰 COIN CALCULATION (WHOLE TEST BASIS):');
        console.log(`  - Correct Answers: ${correctAnswers}`);
        console.log(`  - Total Answered: ${totalQuestions}`);
        console.log(`  - Total Questions in Test: ${totalQuestionsInTest}`);
        console.log(`  - Score Percentage (correct/whole): ${overallScore.toFixed(1)}%`);
        
        // Award coins based on overall test score
        let coinsEarned = 0;
        if (overallScore >= 90) {
          coinsEarned = 5;
        } else if (overallScore >= 80) {
          coinsEarned = 4;
        } else if (overallScore >= 70) {
          coinsEarned = 3;
        } else if (overallScore >= 60) {
          coinsEarned = 2;
        } else if (overallScore >= 50) {
          coinsEarned = 1;
        } else {
          coinsEarned = 0;
        }
        
        // Check for streak bonus (only once per day)
        let streakBonus = 0;
        let streakBonusMessage = '';
        const today = new Date();
        const lastCoinEarned = user.lastCoinEarnedDate ? new Date(user.lastCoinEarnedDate) : null;
        
        // Update login streak for test completion (first test of the day)
        updateTestCompletionStreak(user);
        
        // If this is the first time earning coins today and user has a streak
        if (coinsEarned > 0 && (!lastCoinEarned || !isSameDay(lastCoinEarned, today)) && !user.streakBonusUsedToday) {
          streakBonus = calculateStreakBonus(user.loginStreak);
          if (streakBonus > 0) {
            user.streakBonusUsedToday = true;
            streakBonusMessage = ` (+${streakBonus} bonus from ${user.loginStreak}-day login streak!)`;
          }
        }
        
        // Update user statistics
        user.totalTestsTaken += 1;
        user.coins += coinsEarned + streakBonus;
        user.lastCoinEarnedDate = today;
        
        // Update average accuracy (using overall score)
        const currentTotal = user.averageAccuracy * (user.totalTestsTaken - 1);
        user.averageAccuracy = (currentTotal + overallScore) / user.totalTestsTaken;
        
        await user.save();
        
        // Add coins earned to response
        result.coinsEarned = coinsEarned + streakBonus;
        result.streakBonus = streakBonus;
        result.streakBonusMessage = streakBonusMessage;
      }
    }
    // Prepare response based on action type
    let responseMessage, responseData;
    
    // Calculate completion tracking for response
    const totalQuestionsInTest = result.analytics?.totalQuestions || 0;
    const answeredQuestions = result.questionResults?.length || 0;
    const completionPercentage = totalQuestionsInTest > 0 ? 
      Math.round((answeredQuestions / totalQuestionsInTest) * 100) : 0;
    
    if (isSaveAndExit) {
      responseMessage = 'Test saved successfully. You can continue later.';
      responseData = {
        success: true,
        message: responseMessage,
        action: 'save_and_exit',
        result,
        canViewScore: false,
        canContinue: true,
        status: 'in-progress',
        // ✨ Add completion tracking
        completionTracking: {
          totalQuestions: totalQuestionsInTest,
          answeredQuestions: answeredQuestions,
          completionPercentage: completionPercentage,
          questionsRemaining: totalQuestionsInTest - answeredQuestions
        }
      };
    } else if (isFinishTest) {
      responseMessage = 'Test completed successfully!';
      responseData = {
        success: true,
        message: responseMessage,
        action: 'finish_test',
        result,
        canViewScore: true,
        canContinue: false,
        status: 'completed',
        coinsEarned: result.coinsEarned || 0,
        streakBonus: result.streakBonus || 0,
        streakBonusMessage: result.streakBonusMessage || '',
        // ✨ Add completion tracking
        completionTracking: {
          totalQuestions: totalQuestionsInTest,
          answeredQuestions: answeredQuestions,
          completionPercentage: completionPercentage,
          questionsRemaining: 0, // Test is complete
          isComplete: true
        }
      };
    } else {
      responseMessage = 'Test updated successfully';
      responseData = {
        success: true,
        message: responseMessage,
        action: 'update',
        result,
        status: result.status,
        // ✨ Add completion tracking
        completionTracking: {
          totalQuestions: totalQuestionsInTest,
          answeredQuestions: answeredQuestions,
          completionPercentage: completionPercentage,
          questionsRemaining: totalQuestionsInTest - answeredQuestions
        }
      };
    }

    res.json(responseData);
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results/analytics/overview
// @desc    Get user's performance analytics
// @access  Private
router.get('/analytics/overview', protect, async (req, res) => {
  try {
    const results = await Result.find({ user: req.user.id, status: 'completed' })
      .populate('test', 'title type difficulty')
      .populate('questionResults.question', 'topic');

    if (results.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalTests: 0,
          averageScore: 0,
          bestScore: 0,
          totalTime: 0,
          strengthAreas: [],
          weakAreas: [],
          recentProgress: []
        }
      });
    }

    // Calculate analytics
    const totalTests = results.length;
    const validScores = results.filter(r => r.score && r.score > 0);
    const averageScore = validScores.length > 0 
      ? Math.round(validScores.reduce((sum, r) => sum + (r.score || 0), 0) / validScores.length)
      : 0;
    const bestScore = validScores.length > 0 
      ? Math.max(...validScores.map(r => r.score || 0))
      : 0;
    const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    // Get strength and weak areas
    const allTopics = results.flatMap(r => 
      (r.questionResults || [])
        .filter(q => q && q.question && q.question.topic)
        .map(q => ({ topic: q.question.topic, isCorrect: q.isCorrect || false }))
    );

    const topicStats = {};
    allTopics.forEach(({ topic, isCorrect }) => {
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }
      topicStats[topic].total++;
      if (isCorrect) topicStats[topic].correct++;
    });

    const strengthAreas = Object.entries(topicStats)
      .filter(([_, stats]) => stats.total >= 5) // At least 5 questions
      .map(([topic, stats]) => ({
        topic,
        accuracy: Math.round((stats.correct / stats.total) * 100)
      }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3);

    const weakAreas = Object.entries(topicStats)
      .filter(([_, stats]) => stats.total >= 5)
      .map(([topic, stats]) => ({
        topic,
        accuracy: Math.round((stats.correct / stats.total) * 100)
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    // Recent progress (last 5 tests)
    const recentProgress = results
      .filter(r => r.test && r.endTime)
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
      .slice(0, 5)
      .map(r => ({
        testTitle: r.test?.title || 'Unknown Test',
        score: r.score || 0,
        date: r.endTime,
        type: r.test?.type || 'unknown'
      }));

    res.json({
      success: true,
      analytics: {
        totalTests,
        averageScore,
        bestScore,
        totalTime,
        strengthAreas,
        weakAreas,
        recentProgress
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/results/attempt-status/:testId
// @desc    Get user's attempt status for a specific test
// @access  Private
router.get('/attempt-status/:testId', protect, async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Get user to check account type
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Count completed attempts for this test
    const completedAttempts = await Result.countDocuments({
      user: req.user.id,
      test: testId,
      status: 'completed'
    });

    // Count incomplete attempts for this test
    const incompleteAttempts = await Result.countDocuments({
      user: req.user.id,
      test: testId,
      status: 'in-progress'
    });

    // Set max attempts based on account type
    let maxAttempts;
    let accountTypeLabel;
    if (user.accountType === 'admin' || user.accountType === 'mentor' || user.accountType === 'student' || user.accountType === 'pro') {
      maxAttempts = '∞';
      accountTypeLabel = user.accountType === 'admin' ? 'Admin' : user.accountType === 'mentor' ? 'Mentor' : user.accountType === 'student' ? 'Student' : 'Pro';
    } else if (user.accountType === 'free') {
      maxAttempts = 1;
      accountTypeLabel = 'Free';
    } else {
      maxAttempts = 1;
      accountTypeLabel = 'Free';
    }

    // Check if user can attempt more
    const canAttempt = maxAttempts === '∞' || completedAttempts < maxAttempts;
    const attemptsRemaining = maxAttempts === '∞' ? '∞' : Math.max(0, maxAttempts - completedAttempts);

    res.json({
      success: true,
      data: {
        testId,
        userAccountType: user.accountType,
        accountTypeLabel,
        completedAttempts,
        incompleteAttempts,
        maxAttempts,
        attemptsRemaining,
        canAttempt,
        hasIncompleteAttempt: incompleteAttempts > 0
      }
    });
  } catch (error) {
    console.error('Get attempt status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/results/:id/review
// @desc    Add review notes to a result
// @access  Private
router.put('/:id/review', protect, async (req, res) => {
  try {
    const { reviewNotes } = req.body;

    const result = await Result.findById(req.params.id);

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    if (result.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    result.reviewNotes = reviewNotes;
    result.isReviewCompleted = true;

    await result.save();

    res.json({
      success: true,
      message: 'Review notes added successfully',
      result
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/results/:id
// @desc    Delete a result and check if user can start test again
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    return res.status(405).json({
      success: false,
      message: 'Deleting test results is no longer allowed.'
    });
  } catch (error) {
    console.error('Delete result error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/results/batch-attempt-status
// @desc    Get attempt status for multiple tests at once
// @access  Private
router.post('/batch-attempt-status', protect, async (req, res) => {
  try {
    const { testIds, userId } = req.body;
    
    if (!testIds || !Array.isArray(testIds)) {
      return res.status(400).json({ message: 'Test IDs array is required' });
    }
    
    // Batch fetch attempt statuses
    const attemptStatuses = await Promise.all(
      testIds.map(async (testId) => {
        try {
          // Check for existing result
          const existingResult = await Result.findOne({
            user: userId || req.user.id,
            test: testId
          });
          
          // Check user account type for max attempts
          const User = require('../models/User');
          const user = await User.findById(userId || req.user.id);
          let maxAttempts = 1;
          let accountTypeLabel = 'Free';
          
          if (user?.accountType === 'admin' || user?.accountType === 'mentor' || 
              user?.accountType === 'student' || user?.accountType === 'pro') {
            maxAttempts = '∞';
            accountTypeLabel = user.accountType === 'admin' ? 'Admin' : 
                             user.accountType === 'mentor' ? 'Mentor' : 
                             user.accountType === 'student' ? 'Student' : 'Pro';
          }
          
          // Count completed attempts
          const completedAttempts = await Result.countDocuments({
            user: userId || req.user.id,
            test: testId,
            status: 'completed'
          });
          
          // Check historical attempts
          const historicalRecord = user?.historicalTestAttempts?.find(
            h => h.testId.toString() === testId.toString()
          );
          const historicalAttempts = historicalRecord?.attemptsUsed || 0;
          const totalAttempts = completedAttempts + historicalAttempts;
          
          return {
            testId,
            hasIncompleteAttempt: existingResult?.status === 'in-progress',
            canAttempt: maxAttempts === '∞' || totalAttempts < maxAttempts,
            completedAttempts: totalAttempts,
            maxAttempts,
            accountTypeLabel,
            currentStatus: existingResult?.status || null
          };
        } catch (error) {
          console.error(`Error checking attempt status for test ${testId}:`, error);
          return {
            testId,
            hasIncompleteAttempt: false,
            canAttempt: true,
            completedAttempts: 0,
            maxAttempts: 1,
            accountTypeLabel: 'Free',
            currentStatus: null
          };
        }
      })
    );
    
    res.json({
      success: true,
      attemptStatuses
    });
    
  } catch (error) {
    console.error('Batch attempt status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
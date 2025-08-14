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
    
    let query = { user: req.user.id };
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
// @desc    Get single result by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('test', 'title type sections showAnswers showExplanations')
      .populate('questionResults.question', 'content options explanation topic');

    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }

    if (result.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Get result error:', error);
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
    // Only count COMPLETED tests, not incomplete ones
    const existingCompletedAttempts = await Result.countDocuments({
      user: req.user.id,
      test: testId,
      status: 'completed' // Only count completed tests as attempts
    });

    console.log('Existing completed attempts:', existingCompletedAttempts);
    console.log('User account type:', user.accountType);
    console.log('User role:', user.role);

    // Set max attempts based on account type
    let maxAttempts;
    let accountTypeLabel;
    if (user.accountType === 'admin' || user.accountType === 'teacher') {
      maxAttempts = Infinity; // Unlimited attempts for admin and teacher
      accountTypeLabel = user.accountType === 'admin' ? 'Admin' : 'Teacher';
    } else if (user.accountType === 'free') {
      maxAttempts = 1; // Free account: 1 test attempt
      accountTypeLabel = 'Free';
    } else if (user.accountType === 'student') {
      maxAttempts = 3; // Student account: 3 test attempts
      accountTypeLabel = 'Student';
    } else {
      maxAttempts = 1; // Default to 1 attempt for unknown account types
      accountTypeLabel = 'Free';
    }

    console.log('Max attempts allowed:', maxAttempts);
    console.log('Account type label:', accountTypeLabel);
    console.log('Attempt check result:', maxAttempts !== Infinity && existingCompletedAttempts >= maxAttempts);

    // Check if user has exceeded max attempts
    if (maxAttempts !== Infinity && existingCompletedAttempts >= maxAttempts) {
      if (user.accountType === 'free') {
        return res.status(400).json({ 
          message: `Free account type reached max attempt (${maxAttempts}). Upgrade to student account for more attempts.`,
          accountType: 'free',
          maxAttempts: maxAttempts,
          currentAttempts: existingCompletedAttempts,
          upgradeRequired: true
        });
      } else if (user.accountType === 'student') {
        return res.status(400).json({ 
          message: `Student account type reached max attempt (${maxAttempts}).`,
          accountType: 'student',
          maxAttempts: maxAttempts,
          currentAttempts: existingCompletedAttempts
        });
      } else {
        return res.status(400).json({ 
          message: `${accountTypeLabel} account type reached max attempt (${maxAttempts}).`,
          accountType: user.accountType,
          maxAttempts: maxAttempts,
          currentAttempts: existingCompletedAttempts
        });
      }
    }

    // Check if there's an existing incomplete result that can be resumed
    const existingIncompleteResult = await Result.findOne({
      user: req.user.id,
      test: testId,
      status: 'in-progress'
    });

    if (existingIncompleteResult) {
      console.log('Resuming existing incomplete test:', existingIncompleteResult._id);
      return res.status(200).json({
        success: true,
        message: 'Resuming existing test',
        result: existingIncompleteResult,
        resumed: true
      });
    }

    console.log('Creating new result...');
    const result = await Result.create({
      user: req.user.id,
      test: testId,
      attemptNumber: existingCompletedAttempts + 1,
      startTime: new Date(),
      status: 'in-progress'
    });

    console.log('Result created successfully:', result._id);

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
// @desc    Update test result (submit answers)
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

    if (result.status === 'completed') {
      return res.status(400).json({ message: 'Test already completed' });
    }

    // Update result
    result.questionResults = questionResults;
    result.endTime = endTime || new Date();
    result.status = status;

    await result.save();

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
        const overallScore = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        
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
    res.json({
      success: true,
      message: 'Test completed successfully',
      result,
      coinsEarned: result.coinsEarned || 0,
      streakBonus: result.streakBonus || 0,
      streakBonusMessage: result.streakBonusMessage || ''
    });
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
    if (user.accountType === 'admin' || user.accountType === 'teacher') {
      maxAttempts = Infinity;
      accountTypeLabel = user.accountType === 'admin' ? 'Admin' : 'Teacher';
    } else if (user.accountType === 'free') {
      maxAttempts = 1;
      accountTypeLabel = 'Free';
    } else if (user.accountType === 'student') {
      maxAttempts = 3;
      accountTypeLabel = 'Student';
    } else {
      maxAttempts = 1;
      accountTypeLabel = 'Free';
    }

    // Check if user can attempt more
    const canAttempt = maxAttempts === Infinity || completedAttempts < maxAttempts;
    const attemptsRemaining = maxAttempts === Infinity ? '∞' : Math.max(0, maxAttempts - completedAttempts);

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

module.exports = router; 
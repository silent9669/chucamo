const express = require('express');
const Result = require('../models/Result');
const Test = require('../models/Test');
const { protect } = require('../middleware/auth');

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
    const { testId } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user can access this test
    if (!test.isPublic && test.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user has exceeded max attempts
    const existingAttempts = await Result.countDocuments({
      user: req.user.id,
      test: testId
    });

    if (existingAttempts >= test.maxAttempts) {
      return res.status(400).json({ message: 'Maximum attempts reached for this test' });
    }

    const result = await Result.create({
      user: req.user.id,
      test: testId,
      attemptNumber: existingAttempts + 1,
      startTime: new Date(),
      status: 'in-progress'
    });

    res.status(201).json({
      success: true,
      message: 'Test started successfully',
      result
    });
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ message: 'Server error' });
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
        
        // Update user statistics
        user.totalTestsTaken += 1;
        user.coins += coinsEarned;
        
        // Update average accuracy (using overall score)
        const currentTotal = user.averageAccuracy * (user.totalTestsTaken - 1);
        user.averageAccuracy = (currentTotal + overallScore) / user.totalTestsTaken;
        
        await user.save();
        
        // Add coins earned to response
        result.coinsEarned = coinsEarned;
      }
    }

    res.json({
      success: true,
      message: 'Test completed successfully',
      result,
      coinsEarned: result.coinsEarned || 0
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
      .populate('test', 'title type difficulty');

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
    const averageScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalTests);
    const bestScore = Math.max(...results.map(r => r.score));
    const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    // Get strength and weak areas
    const allTopics = results.flatMap(r => 
      r.questionResults
        .filter(q => q.question && q.question.topic)
        .map(q => ({ topic: q.question.topic, isCorrect: q.isCorrect }))
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
      .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
      .slice(0, 5)
      .map(r => ({
        testTitle: r.test.title,
        score: r.score,
        date: r.endTime,
        type: r.test.type
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
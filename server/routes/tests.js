const express = require('express');
const { body, validationResult } = require('express-validator');
const Test = require('../models/Test');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/tests
// @desc    Get all tests (public and user's private tests)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type, difficulty, page = 1, limit = 10, search, testType } = req.query;
    
    // Build query based on user account type and test visibility
    let query = { 
      $or: [
        { createdBy: req.user.id }, // User's own tests
        { 
          isActive: true,
          $or: [
            { visibleTo: 'all' }, // Visible to all users
            { visibleTo: req.user.accountType }, // Visible to user's account type
            { 
              visibleTo: { $exists: false }, // Legacy tests without visibleTo field
              isPublic: true 
            }
          ]
        }
      ]
    };

    if (type) query.type = type;
    if (testType) query.testType = testType; // Add support for testType filtering
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    logger.debug('Tests query:', Object.keys(query).length, 'items', { search, type, testType, difficulty, page, limit });
    
    const tests = await Test.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Test.countDocuments(query);
    
    logger.debug('Found tests count:', tests.length);
    logger.debug('Total tests in query:', total);
    logger.debug('Test titles:', tests.map(t => t.title));

    res.json({
      success: true,
      tests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get tests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tests/:id
// @desc    Get single test by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user can access this test
    const isOwnTest = test.createdBy._id.toString() === req.user.id;
    const isVisibleToUser = test.visibleTo === 'all' || 
                           test.visibleTo === req.user.accountType ||
                           (test.visibleTo === undefined && test.isPublic);
    
    if (!isOwnTest && !isVisibleToUser) {
      return res.status(403).json({ message: 'Access denied' });
    }

    logger.debug('=== GETTING TEST ===');
    logger.debug('Test ID:', req.params.id);
    logger.debug('Test sections:', JSON.stringify(test.sections, null, 2));

    res.json({
      success: true,
      test
    });
  } catch (error) {
    logger.error('Get test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tests
// @desc    Create a new test (mentors and admins only)
// @access  Private
router.post('/', protect, authorize('admin'), [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('type').isIn(['full', 'math', 'reading', 'writing', 'custom', 'study-plan']).withMessage('Invalid test type'),
  body('testType').optional().isIn(['practice', 'study-plan']).withMessage('Invalid test type'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']).withMessage('Invalid difficulty level'),
  body('sections').isArray({ min: 1 }).withMessage('At least one section is required'),
  body('sections.*.name').trim().isLength({ min: 1, max: 100 }).withMessage('Section name must be between 1 and 100 characters'),
  body('sections.*.type').isIn(['english', 'math']).withMessage('Section type must be either english or math'),
  body('sections.*.timeLimit').isInt({ min: 1 }).withMessage('Time limit must be at least 1 minute'),
  body('sections.*.questionCount').isInt({ min: 1 }).withMessage('Question count must be at least 1'),
  body('passingScore').optional().isInt({ min: 400, max: 1600 }).withMessage('Passing score must be between 400 and 1600'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('instructions').optional().trim().isLength({ max: 2000 }).withMessage('Instructions cannot exceed 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('POST Validation errors:', errors.array());
      logger.debug('POST Request body:', req.body);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const {
      title,
      description,
      type,
      testType,
      difficulty,
      sections,
      totalTime,
      totalQuestions,
      passingScore,
      tags,
      instructions,
      allowRetakes,
      maxAttempts,
      showAnswers,
      showExplanations
    } = req.body;

    logger.debug('=== CREATING TEST ===');
    logger.debug('Sections data:', JSON.stringify(sections, null, 2));
    logger.debug('Total questions:', totalQuestions);
    
    // Log question types being saved
    if (sections && sections.length > 0) {
      logger.debug('=== QUESTION TYPES BEING SAVED ===');
      sections.forEach((section, sectionIndex) => {
        if (section.questions && section.questions.length > 0) {
          logger.debug(`Section ${sectionIndex + 1} (${section.name}) questions:`);
          section.questions.forEach((question, questionIndex) => {
            logger.debug(`  Question ${questionIndex + 1}:`, {
              id: question.id,
              type: question.type,
              answerType: question.answerType,
              question: question.question?.substring(0, 50) + '...'
            });
          });
        }
      });
    }

    const test = await Test.create({
      title,
      description,
      type,
      testType,
      difficulty,
      sections,
      totalTime,
      totalQuestions,
      passingScore,
      tags,
      instructions,
      allowRetakes,
      maxAttempts,
      showAnswers,
      showExplanations,
      createdBy: req.user.id
    });

    logger.debug('=== TEST CREATED ===');
    logger.debug('Saved test sections:', JSON.stringify(test.sections, null, 2));
    
    // Log question types after saving
    if (test.sections && test.sections.length > 0) {
      logger.debug('=== QUESTION TYPES AFTER SAVING ===');
      test.sections.forEach((section, sectionIndex) => {
        if (section.questions && section.questions.length > 0) {
          logger.debug(`Section ${sectionIndex + 1} (${section.name}) questions:`);
          section.questions.forEach((question, questionIndex) => {
            logger.debug(`  Question ${questionIndex + 1}:`, {
              id: question.id,
              type: question.type,
              answerType: question.answerType,
              question: question.question?.substring(0, 50) + '...'
            });
          });
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      test
    });
  } catch (error) {
    logger.error('Create test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tests/:id
// @desc    Update a test
// @access  Private (test creator or admin)
router.put('/:id', protect, authorize('mentor', 'admin'), [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('type').optional().isIn(['full', 'math', 'reading', 'writing', 'custom', 'study-plan']).withMessage('Invalid test type'),
  body('testType').optional().isIn(['practice', 'study-plan']).withMessage('Invalid test type'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']).withMessage('Invalid difficulty level'),
  body('sections').optional().isArray({ min: 1 }).withMessage('At least one section is required'),
  body('sections.*.type').optional().isIn(['english', 'math']).withMessage('Section type must be either english or math'),
  body('passingScore').optional().isInt({ min: 400, max: 1600 }).withMessage('Passing score must be between 400 and 1600'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('instructions').optional().trim().isLength({ max: 2000 }).withMessage('Instructions cannot exceed 2000 characters'),
  body('visibleTo').optional().isIn(['all', 'free', 'student']).withMessage('Visibility must be all, free, or student')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.debug('PUT Validation errors:', errors.array());
      logger.debug('PUT Request body:', req.body);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    let test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user can update this test
    if (test.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    logger.debug('=== UPDATING TEST ===');
    logger.debug('Update data:', JSON.stringify(req.body, null, 2));
    
    // Log question types being updated
    if (req.body.sections && req.body.sections.length > 0) {
      logger.debug('=== QUESTION TYPES BEING UPDATED ===');
      req.body.sections.forEach((section, sectionIndex) => {
        if (section.questions && section.questions.length > 0) {
          logger.debug(`Section ${sectionIndex + 1} (${section.name}) questions:`);
          section.questions.forEach((question, questionIndex) => {
            logger.debug(`  Question ${questionIndex + 1}:`, {
              id: question.id,
              type: question.type,
              answerType: question.answerType,
              question: question.question?.substring(0, 50) + '...'
            });
          });
        }
      });
    }

    test = await Test.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    logger.debug('=== TEST UPDATED ===');
    logger.debug('Updated test sections:', JSON.stringify(test.sections, null, 2));
    
    // Log question types after updating
    if (test.sections && test.sections.length > 0) {
      logger.debug('=== QUESTION TYPES AFTER UPDATING ===');
      test.sections.forEach((section, sectionIndex) => {
        if (section.questions && section.questions.length > 0) {
          logger.debug(`Section ${sectionIndex + 1} (${section.name}) questions:`);
          section.questions.forEach((question, questionIndex) => {
            logger.debug(`  Question ${questionIndex + 1}:`, {
              id: question.id,
              type: question.type,
              answerType: question.answerType,
              question: question.question?.substring(0, 50) + '...'
            });
          });
        }
      });
    }

    res.json({
      success: true,
      message: 'Test updated successfully',
      test
    });
  } catch (error) {
    logger.error('Update test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tests/:id
// @desc    Delete a test
// @access  Private (test creator or admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user can delete this test
    if (test.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Test.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    logger.error('Delete test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tests/:id/questions
// @desc    Get questions for a specific test
// @access  Private
router.get('/:id/questions', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if user can access this test
    if (!test.isPublic && test.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const Question = require('../models/Question');
    const questions = await Question.find({ 
      test: req.params.id,
      isActive: true 
    }).sort({ section: 1, questionNumber: 1 });

    res.json({
      success: true,
      questions,
      testInfo: {
        id: test._id,
        title: test.title,
        type: test.type,
        sections: test.sections,
        totalTime: test.totalTime,
        totalQuestions: test.totalQuestions
      }
    });
  } catch (error) {
    logger.error('Get test questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tests/:id/duplicate
// @desc    Duplicate a test (mentors and admins only)
// @access  Private
router.post('/:id/duplicate', protect, authorize('mentor', 'admin'), async (req, res) => {
  try {
    const originalTest = await Test.findById(req.params.id);

    if (!originalTest) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Create duplicate test
    const duplicatedTest = await Test.create({
      ...originalTest.toObject(),
      _id: undefined,
      title: `${originalTest.title} (Copy)`,
      createdBy: req.user.id,
      isPublic: false,
      attempts: 0,
      averageScore: 0
    });

    // Duplicate questions if they exist
    const Question = require('../models/Question');
    const originalQuestions = await Question.find({ test: req.params.id });
    
    if (originalQuestions.length > 0) {
      const duplicatedQuestions = originalQuestions.map(q => ({
        ...q.toObject(),
        _id: undefined,
        test: duplicatedTest._id,
        createdBy: req.user.id,
        usageCount: 0,
        successRate: 0,
        averageTimeSpent: 0
      }));

      await Question.insertMany(duplicatedQuestions);
    }

    res.status(201).json({
      success: true,
      message: 'Test duplicated successfully',
      test: duplicatedTest
    });
  } catch (error) {
    logger.error('Duplicate test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tests/:id/debug
// @desc    Debug endpoint to check test data structure
// @access  Private
router.get('/:id/debug', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    logger.debug('=== DEBUG TEST DATA ===');
    logger.debug('Test ID:', req.params.id);
    logger.debug('Test title:', test.title);
    logger.debug('Sections count:', test.sections?.length || 0);
    
    if (test.sections) {
      test.sections.forEach((section, index) => {
        logger.debug(`Section ${index + 1}:`, {
          name: section.name,
          type: section.type,
          timeLimit: section.timeLimit,
          questionCount: section.questionCount,
          questionsCount: section.questions?.length || 0,
          questions: section.questions?.map(q => ({
            id: q.id,
            question: q.question?.substring(0, 50) + '...',
            hasKaTeX: q.question?.includes('$') || false
          }))
        });
      });
    }

    res.json({
      success: true,
      debug: {
        testId: test._id,
        title: test.title,
        sectionsCount: test.sections?.length || 0,
        sections: test.sections?.map(section => ({
          name: section.name,
          type: section.type,
          timeLimit: section.timeLimit,
          questionCount: section.questionCount,
          questionsCount: section.questions?.length || 0,
          questions: section.questions?.map(q => ({
            id: q.id,
            type: q.type,
            answerType: q.answerType,
            correctAnswer: q.correctAnswer,
            hasOptions: q.options && q.options.length > 0,
            optionsCount: q.options ? q.options.length : 0,
            question: q.question?.substring(0, 100),
            hasKaTeX: q.question?.includes('$') || false
          }))
        }))
      }
    });
  } catch (error) {
    logger.error('Debug test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tests/history
// @desc    Get user's test history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    // Get test completion data from localStorage-like storage or database
    // For now, we'll return a mock structure that can be enhanced later
    const testHistory = [
      {
        id: '1',
        title: 'Sample Math Test',
        type: 'math',
        completed: true,
        score: 85,
        correctAnswers: 17,
        incorrectAnswers: 3,
        totalQuestions: 20,
        answeredQuestions: 20,
        timeSpent: 1800, // 30 minutes
        completedAt: new Date().toISOString(),
        startedAt: new Date(Date.now() - 1800000).toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        title: 'English Reading Test',
        type: 'english',
        completed: false,
        score: null,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalQuestions: 15,
        answeredQuestions: 8,
        timeSpent: 900, // 15 minutes
        completedAt: null,
        startedAt: new Date(Date.now() - 7200000).toISOString(),
        createdAt: new Date(Date.now() - 10800000).toISOString()
      }
    ];

    res.json({
      success: true,
      data: testHistory
    });
  } catch (error) {
    logger.error('Get test history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tests/:id/results
// @desc    Get test results for a specific test
// @access  Private
router.get('/:id/results', protect, async (req, res) => {
  try {
    const testId = req.params.id;
    
    // Mock test results - this would come from a database in a real implementation
    const testResults = {
      testId: testId,
      userId: req.user.id,
      score: 85,
      correctAnswers: 17,
      incorrectAnswers: 3,
      totalQuestions: 20,
      timeSpent: 1800, // 30 minutes
      completed: true,
      completedAt: new Date().toISOString(),
      answers: {
        '1': { selectedAnswer: 'A', isCorrect: true },
        '2': { selectedAnswer: 'B', isCorrect: false },
        '3': { selectedAnswer: 'C', isCorrect: true },
        '4': { selectedAnswer: 'D', isCorrect: true },
        '5': { selectedAnswer: 'A', isCorrect: false }
      }
    };

    res.json({
      success: true,
      data: testResults
    });
  } catch (error) {
    logger.error('Get test results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
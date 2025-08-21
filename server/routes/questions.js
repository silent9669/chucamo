const express = require('express');
const { body, validationResult } = require('express-validator');
const Question = require('../models/Question');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/questions
// @desc    Get questions with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { test, section, topic, difficulty, page = 1, limit = 20 } = req.query;
    
    let query = { isActive: true };
    if (test) query.test = test;
    if (section) query.section = section;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;

    const skip = (page - 1) * limit;
    
    const questions = await Question.find(query)
      .populate('test', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      questions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/questions/:id
// @desc    Get a single question by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    logger.debug('Fetching question with ID:', req.params.id);
    
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      logger.debug('Question not found');
      return res.status(404).json({ message: 'Question not found' });
    }
    
    logger.debug('Question found:', question._id);
    
    res.json(question);
  } catch (error) {
    logger.error('Get question by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions
// @desc    Create a new question (mentors and admins only)
// @access  Private
router.post('/', protect, authorize('admin'), [
  body('type').isIn(['multiple-choice', 'grid-in', 'essay', 'true-false', 'matching']).withMessage('Invalid question type'),
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Content must be between 1 and 5000 characters'),
  body('correctAnswer').notEmpty().withMessage('Correct answer is required'),
  body('topic').isIn([
    'Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Probability', 'Functions',
    'Literature', 'History', 'Science', 'Social Studies', 'Vocabulary', 'Comprehension',
    'Grammar', 'Punctuation', 'Sentence Structure', 'Rhetoric', 'Essay Writing'
  ]).withMessage('Invalid topic'),
  body('options').optional().isArray().withMessage('Options must be an array'),
  body('explanation').optional().trim().isLength({ max: 2000 }).withMessage('Explanation cannot exceed 2000 characters'),
  body('passage').optional().trim().isLength({ max: 10000 }).withMessage('Passage cannot exceed 10000 characters'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level')
], async (req, res) => {
  try {
    logger.debug('=== CREATE QUESTION DEBUG ===');
    logger.debug('Received question data:', req.body);
    logger.debug('Images in request:', req.body.images);
    logger.debug('Images array length:', req.body.images ? req.body.images.length : 0);
    logger.debug('Images array type:', typeof req.body.images);
    logger.debug('Images array is array:', Array.isArray(req.body.images));
    logger.debug('User ID:', req.user.id);
    
    // Additional validation for images array structure
    if (req.body.images && Array.isArray(req.body.images)) {
      logger.debug('Validating images array structure...');
      req.body.images.forEach((img, index) => {
        logger.debug(`Image ${index}:`, img);
        if (!img.url || !img.name) {
          logger.debug(`Image ${index} missing required fields:`, img);
        }
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const questionData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    logger.debug('Creating question with data:', questionData);
    logger.debug('Images being saved:', questionData.images);
    logger.debug('Images array length in questionData:', questionData.images ? questionData.images.length : 0);
    logger.debug('Images array structure in questionData:', questionData.images);

    const question = await Question.create(questionData);

    logger.info('Question created successfully:', question._id);
    logger.debug('Created question with images:', question.images);
    logger.debug('Created question images array length:', question.images ? question.images.length : 0);
    logger.debug('Created question images structure:', question.images);
    logger.debug('=== CREATE QUESTION COMPLETE ===');

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    logger.error('Create question error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question
// @access  Private (question creator or admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    logger.debug('Updating question with ID:', req.params.id);
    
    // Validate images array structure for update
    if (req.body.images && Array.isArray(req.body.images)) {
      logger.debug('Validating images array structure for update...');
      
      for (let index = 0; index < req.body.images.length; index++) {
        const img = req.body.images[index];
        if (!img.url || !img.altText) {
          logger.debug(`Update Image ${index} missing required fields:`, img);
          return res.status(400).json({ 
            message: `Image ${index + 1} is missing required fields` 
          });
        }
      }
    }
    
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      logger.debug('Question not found in database');
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check if user is authorized to update this question
    if (question.createdBy.toString() !== req.user.id && req.user.accountType !== 'admin') {
      logger.debug('Access denied - user not authorized');
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update the question
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    logger.debug('Question updated successfully:', updatedQuestion._id);
    
    res.json(updatedQuestion);
  } catch (error) {
    logger.error('Update question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Private (question creator or admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Question.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
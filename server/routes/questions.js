const express = require('express');
const { body, validationResult } = require('express-validator');
const Question = require('../models/Question');
const { protect, authorize } = require('../middleware/auth');

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
    console.log('=== GET QUESTION DEBUG ===');
    console.log('Fetching question with ID:', req.params.id);
    console.log('User ID:', req.user.id);
    
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      console.log('Question not found');
      return res.status(404).json({ message: 'Question not found' });
    }

    console.log('Question found:', question._id);
    console.log('Question images:', question.images);
    console.log('Question images array length:', question.images ? question.images.length : 0);
    console.log('=== GET QUESTION COMPLETE ===');

    res.json(question);
  } catch (error) {
    console.error('Get question by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions
// @desc    Create a new question (teachers and admins only)
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
    console.log('=== CREATE QUESTION DEBUG ===');
    console.log('Received question data:', req.body);
    console.log('Images in request:', req.body.images);
    console.log('Images array length:', req.body.images ? req.body.images.length : 0);
    console.log('Images array type:', typeof req.body.images);
    console.log('Images array is array:', Array.isArray(req.body.images));
    console.log('User ID:', req.user.id);
    
    // Additional validation for images array structure
    if (req.body.images && Array.isArray(req.body.images)) {
      console.log('Validating images array structure...');
      req.body.images.forEach((img, index) => {
        console.log(`Image ${index}:`, img);
        if (!img.url || !img.name) {
          console.log(`Image ${index} missing required fields:`, img);
        }
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const questionData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    console.log('Creating question with data:', questionData);
    console.log('Images being saved:', questionData.images);
    console.log('Images array length in questionData:', questionData.images ? questionData.images.length : 0);
    console.log('Images array structure in questionData:', questionData.images);

    const question = await Question.create(questionData);

    console.log('Question created successfully:', question._id);
    console.log('Created question with images:', question.images);
    console.log('Created question images array length:', question.images ? question.images.length : 0);
    console.log('Created question images structure:', question.images);
    console.log('=== CREATE QUESTION COMPLETE ===');

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question
// @access  Private (question creator or admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('=== UPDATE QUESTION DEBUG ===');
    console.log('Updating question with ID:', req.params.id);
    console.log('Update data received:', req.body);
    console.log('Images in update request:', req.body.images);
    console.log('Images array length:', req.body.images ? req.body.images.length : 0);
    console.log('Images array type:', typeof req.body.images);
    console.log('Images array is array:', Array.isArray(req.body.images));
    console.log('User ID:', req.user.id);
    
    // Additional validation for images array structure
    if (req.body.images && Array.isArray(req.body.images)) {
      console.log('Validating images array structure for update...');
      req.body.images.forEach((img, index) => {
        console.log(`Update Image ${index}:`, img);
        if (!img.url || !img.name) {
          console.log(`Update Image ${index} missing required fields:`, img);
        }
      });
    }
    
    let question = await Question.findById(req.params.id);

    if (!question) {
      console.log('Question not found in database');
      return res.status(404).json({ message: 'Question not found' });
    }

    console.log('Found existing question:', question._id);
    console.log('Existing question images:', question.images);
    console.log('Existing question images array length:', question.images ? question.images.length : 0);
    console.log('Existing question images structure:', question.images);

    if (question.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log('Access denied - user not authorized');
      return res.status(403).json({ message: 'Access denied' });
    }

    question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    console.log('Question updated successfully:', question._id);
    console.log('Updated question with images:', question.images);
    console.log('Updated question images array length:', question.images ? question.images.length : 0);
    console.log('Updated question images structure:', question.images);
    console.log('=== UPDATE QUESTION COMPLETE ===');

    res.json({
      success: true,
      message: 'Question updated successfully',
      question
    });
  } catch (error) {
    console.error('Update question error:', error);
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
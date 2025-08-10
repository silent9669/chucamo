const express = require('express');
const { body, validationResult } = require('express-validator');
const Article = require('../models/Article');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/articles
// @desc    Get all published articles
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      difficulty, 
      search, 
      featured,
      sort = 'createdAt'
    } = req.query;
    
    let query = { 
      isPublished: true, 
      isActive: true 
    };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (featured === 'true') query.featured = true;
    
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    
    let sortOption = {};
    switch (sort) {
      case 'title':
        sortOption = { title: 1 };
        break;
      case 'views':
        sortOption = { views: -1 };
        break;

      case 'readingTime':
        sortOption = { readingTime: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    const articles = await Article.find(query)
      .populate('author', 'firstName lastName')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content'); // Don't send full content in list

    const total = await Article.countDocuments(query);

    res.json({
      success: true,
      articles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Get articles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/articles/:id
// @desc    Get single article by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    logger.debug(`Fetching article with ID: ${req.params.id}`);
    
    // First try to find the article without population to see if it exists
    let article = await Article.findById(req.params.id)
      .where({ isPublished: true, isActive: true });

    if (!article) {
      logger.warn(`Article not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Article not found' });
    }

    logger.debug(`Article found: ${article.title}`);

    // Try to populate author, but handle cases where author might be missing
    try {
      if (article.author) {
        await article.populate('author', 'firstName lastName username');
      }
    } catch (populateError) {
      logger.warn(`Failed to populate author for article ${req.params.id}:`, populateError.message);
      // Continue without author population
    }

    // Increment view count
    try {
      article.views = (article.views || 0) + 1;
      await article.save();
    } catch (saveError) {
      logger.warn(`Failed to increment views for article ${req.params.id}:`, saveError.message);
      // Continue without saving view count
    }

    res.json({
      success: true,
      article
    });
  } catch (error) {
    logger.error('Get article error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/articles
// @desc    Create a new article (admin only)
// @access  Private
router.post('/', protect, authorize('admin'), [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  body('category').optional().isIn(['math', 'reading', 'writing', 'general', 'tips', 'strategies']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('readingPassage').optional().trim(),
  body('thumbnail').optional().trim(),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('featured').optional().isBoolean().withMessage('Featured must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const articleData = {
      ...req.body,
      author: req.user.id
    };

    const article = await Article.create(articleData);

    logger.info(`Article created: ${article.title} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      article
    });
  } catch (error) {
    logger.error('Create article error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/articles/:id
// @desc    Update an article (admin only)
// @access  Private
router.put('/:id', protect, authorize('admin'), [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('content').optional().trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  body('category').optional().isIn(['math', 'reading', 'writing', 'general', 'tips', 'strategies']).withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('readingPassage').optional().trim(),
  body('thumbnail').optional().trim(),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Update article
    Object.assign(article, req.body);
    await article.save();

    logger.info(`Article updated: ${article.title} by ${req.user.username}`);

    res.json({
      success: true,
      article
    });
  } catch (error) {
    logger.error('Update article error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/articles/:id
// @desc    Delete an article (admin only)
// @access  Private
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    await article.remove();

    logger.info(`Article deleted: ${article.title} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    logger.error('Delete article error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;

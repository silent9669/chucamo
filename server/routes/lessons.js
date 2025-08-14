const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all lessons with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      status, 
      search,
      category,
      instructor 
    } = req.query;

    const filter = {};

    // Apply filters
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;
    if (category) filter.category = category;
    if (instructor) filter.instructor = instructor;

    // Apply search
    if (search) {
      filter.$text = { $search: search };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: { path: 'createdBy', select: 'name email' }
    };

    const lessons = await Lesson.paginate(filter, options);

    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    logger.error('Error fetching lessons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lessons',
      error: error.message
    });
  }
});

// Get lesson by ID
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    logger.error('Error fetching lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lesson',
      error: error.message
    });
  }
});

// Create new lesson
router.post('/', protect, async (req, res) => {
  try {
            const {
          title,
          description,
          youtubeUrl,
          pdfUrl,
          type,
          thumbnail
        } = req.body;

          // Validate required fields
      if (!title || !description || !type) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, and type are required'
        });
      }

    // Create lesson
    const lesson = new Lesson({
      title,
      description,
      youtubeUrl,
      pdfUrl,
      type,
      thumbnail: thumbnail || '📚',
      createdBy: req.user.id
    });

    await lesson.save();

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson
    });
  } catch (error) {
    logger.error('Error creating lesson:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create lesson',
      error: error.message
    });
  }
});

// Update lesson
router.put('/:id', protect, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is the creator or admin
    if (lesson.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lesson'
      });
    }

    const updatedLesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: updatedLesson
    });
  } catch (error) {
    logger.error('Error updating lesson:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update lesson',
      error: error.message
    });
  }
});

// Delete lesson
router.delete('/:id', protect, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is the creator or admin
    if (lesson.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this lesson'
      });
    }

    await Lesson.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting lesson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lesson',
      error: error.message
    });
  }
});

// Update lesson status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be draft, published, or archived'
      });
    }

    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user is the creator or admin
    if (lesson.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lesson'
      });
    }

    lesson.status = status;
    lesson.updatedAt = Date.now();
    await lesson.save();

    res.json({
      success: true,
      message: 'Lesson status updated successfully',
      data: lesson
    });
  } catch (error) {
    logger.error('Error updating lesson status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lesson status',
      error: error.message
    });
  }
});

// Increment lesson views
router.patch('/:id/view', async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    logger.error('Error incrementing lesson views:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increment lesson views',
      error: error.message
    });
  }
});

module.exports = router;

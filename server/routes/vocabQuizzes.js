const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const VocabQuiz = require('../models/VocabQuiz');
const logger = require('../utils/logger');

// Get all vocabulary quizzes (public)
router.get('/', async (req, res) => {
  try {
    const quizzes = await VocabQuiz.find({ isActive: true, isPublic: true })
      .select('title description difficulty timeLimit totalQuestions tags createdAt')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, quizzes });
  } catch (error) {
    logger.error('Error fetching vocabulary quizzes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vocabulary quizzes' });
  }
});

// Get vocabulary quiz by ID
router.get('/:id', async (req, res) => {
  try {
    const quiz = await VocabQuiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Vocabulary quiz not found' });
    }
    
    if (!quiz.isActive || !quiz.isPublic) {
      return res.status(403).json({ success: false, message: 'Vocabulary quiz is not available' });
    }
    
    res.json({ success: true, quiz });
  } catch (error) {
    logger.error('Error fetching vocabulary quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vocabulary quiz' });
  }
});

// Get all vocabulary quizzes for admin management
router.get('/admin/all', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const quizzes = await VocabQuiz.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, quizzes });
  } catch (error) {
    logger.error('Error fetching vocabulary quizzes for admin:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vocabulary quizzes' });
  }
});

// Create new vocabulary quiz (Admin only)
router.post('/', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const { title, description, difficulty, timeLimit, sections, tags, isActive, isPublic, visibleTo } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    if (!sections || sections.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one section is required' });
    }

    // Validate sections only contain reading and writing types
    const invalidSections = sections.filter(section => !['reading', 'writing'].includes(section.type));
    if (invalidSections.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vocabulary quizzes can only contain reading and writing sections' 
      });
    }

    const totalTime = sections.reduce((total, section) => total + (section.timeLimit || 0), 0);
    const totalQuestions = sections.reduce((total, section) => total + (section.questions?.length || 0), 0);

    const newQuiz = new VocabQuiz({
      title,
      description,
      difficulty: difficulty || 'medium',
      timeLimit: timeLimit || totalTime,
      sections,
      totalTime,
      totalQuestions,
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true,
      isPublic: isPublic !== undefined ? isPublic : true,
      visibleTo: visibleTo || 'all',
      createdBy: req.user._id
    });

    const savedQuiz = await newQuiz.save();
    res.status(201).json({ success: true, quiz: savedQuiz });
  } catch (error) {
    logger.error('Error creating vocabulary quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to create vocabulary quiz' });
  }
});

// Update vocabulary quiz (Admin only)
router.put('/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const { title, description, difficulty, timeLimit, sections, tags, isActive, isPublic, visibleTo } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit;
    if (tags !== undefined) updateData.tags = tags;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (visibleTo !== undefined) updateData.visibleTo = visibleTo;

    if (sections !== undefined) {
      // Validate sections only contain reading and writing types
      const invalidSections = sections.filter(section => !['reading', 'writing'].includes(section.type));
      if (invalidSections.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Vocabulary quizzes can only contain reading and writing sections' 
        });
      }

      const totalTime = sections.reduce((total, section) => total + (section.timeLimit || 0), 0);
      const totalQuestions = sections.reduce((total, section) => total + (section.questions?.length || 0), 0);

      updateData.sections = sections;
      updateData.totalTime = totalTime;
      updateData.totalQuestions = totalQuestions;
    }

    const updatedQuiz = await VocabQuiz.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedQuiz) {
      return res.status(404).json({ success: false, message: 'Vocabulary quiz not found' });
    }

    res.json({ success: true, quiz: updatedQuiz });
  } catch (error) {
    logger.error('Error updating vocabulary quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to update vocabulary quiz' });
  }
});

// Delete vocabulary quiz (Admin only)
router.delete('/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const deletedQuiz = await VocabQuiz.findByIdAndDelete(req.params.id);
    if (!deletedQuiz) {
      return res.status(404).json({ success: false, message: 'Vocabulary quiz not found' });
    }

    res.json({ success: true, message: 'Vocabulary quiz deleted successfully' });
  } catch (error) {
    logger.error('Error deleting vocabulary quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to delete vocabulary quiz' });
  }
});

// Toggle quiz active status (Admin only)
router.patch('/:id/toggle-active', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const quiz = await VocabQuiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Vocabulary quiz not found' });
    }

    quiz.isActive = !quiz.isActive;
    const updatedQuiz = await quiz.save();

    res.json({ 
      success: true, 
      quiz: updatedQuiz,
      message: `Quiz ${updatedQuiz.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    logger.error('Error toggling quiz active status:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle quiz status' });
  }
});

// Duplicate vocabulary quiz (Admin only)
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const originalQuiz = await VocabQuiz.findById(req.params.id);
    if (!originalQuiz) {
      return res.status(404).json({ success: false, message: 'Vocabulary quiz not found' });
    }

    const duplicatedQuiz = new VocabQuiz({
      ...originalQuiz.toObject(),
      _id: undefined,
      title: `${originalQuiz.title} (Copy)`,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const savedQuiz = await duplicatedQuiz.save();
    res.status(201).json({ success: true, quiz: savedQuiz });
  } catch (error) {
    logger.error('Error duplicating vocabulary quiz:', error);
    res.status(500).json({ success: false, message: 'Failed to duplicate vocabulary quiz' });
  }
});

module.exports = router;

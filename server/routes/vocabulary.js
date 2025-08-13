const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const VocabularySet = require('../models/Vocabulary');
const logger = require('../utils/logger');



// Get all vocabulary sets
router.get('/sets', async (req, res) => {
  try {
    let sets = await VocabularySet.find()
      .select('title description difficulty tags studyCount averageScore createdAt words')
      .sort({ createdAt: -1 });
    
    // Manually calculate wordCount to avoid virtual field issues
    sets = sets.map(set => {
      const setObj = set.toObject();
      setObj.wordCount = setObj.words ? setObj.words.length : 0;
      return setObj;
    });
    
    // Filter active sets if we have any
    if (sets.length > 0) {
      const activeSets = sets.filter(set => set.isActive !== false);
      sets = activeSets;
    }
    
    res.json({ success: true, vocabSets: sets });
  } catch (error) {
    logger.error('Error fetching vocabulary sets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vocabulary sets' });
  }
});

// Get vocabulary set by ID with words
router.get('/sets/:id', async (req, res) => {
  try {
    const set = await VocabularySet.findById(req.params.id);
    if (!set) {
      return res.status(404).json({ success: false, message: 'Vocabulary set not found' });
    }
    
    res.json({ success: true, vocabSet: set });
  } catch (error) {
    logger.error('Error fetching vocabulary set:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vocabulary set' });
  }
});

// Create new vocabulary set (Admin only)
router.post('/sets', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const { title, description, difficulty, tags, words } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const newSet = new VocabularySet({
      title,
      description,
      difficulty: difficulty || 'medium',
      tags: tags || [],
      words: words || [],
      isActive: true,
      createdBy: req.user._id
    });

    const savedSet = await newSet.save();
    res.status(201).json({ success: true, vocabSet: savedSet });
  } catch (error) {
    logger.error('Error creating vocabulary set:', error);
    res.status(500).json({ success: false, message: 'Failed to create vocabulary set' });
  }
});

// Update vocabulary set (Admin only)
router.put('/sets/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const { title, description, difficulty, tags, isActive } = req.body;
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (tags !== undefined) updateData.tags = tags;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSet = await VocabularySet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSet) {
      return res.status(404).json({ success: false, message: 'Vocabulary set not found' });
    }

    res.json({ success: true, vocabSet: updatedSet });
  } catch (error) {
    logger.error('Error updating vocabulary set:', error);
    res.status(500).json({ success: false, message: 'Failed to update vocabulary set' });
  }
});

// Delete vocabulary set (Admin only)
router.delete('/sets/:id', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const deletedSet = await VocabularySet.findByIdAndDelete(req.params.id);
    if (!deletedSet) {
      return res.status(404).json({ success: false, message: 'Vocabulary set not found' });
    }

    res.json({ success: true, message: 'Vocabulary set deleted successfully' });
  } catch (error) {
    logger.error('Error deleting vocabulary set:', error);
    res.status(500).json({ success: false, message: 'Failed to delete vocabulary set' });
  }
});

// Add word to vocabulary set (Admin only)
router.post('/sets/:id/words', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

         const { word, definition, image, example, order } = req.body;
     
     if (!word || !definition) {
       return res.status(400).json({
         success: false,
         message: 'Word and definition are required'
       });
     }

    const vocabSet = await VocabularySet.findById(req.params.id);
    if (!vocabSet) {
      return res.status(404).json({ success: false, message: 'Vocabulary set not found' });
    }

         const newWord = {
       word,
       definition,
       image: image || '',
       example,
       order: order || vocabSet.words.length
     };

    vocabSet.words.push(newWord);
    const updatedSet = await vocabSet.save();

    res.status(201).json({ success: true, vocabSet: updatedSet });
  } catch (error) {
    logger.error('Error adding word to vocabulary set:', error);
    res.status(500).json({ success: false, message: 'Failed to add word' });
  }
});

// Update word in vocabulary set (Admin only)
router.put('/sets/:setId/words/:wordId', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

         const { word, definition, image, example, order } = req.body;
    
    const vocabSet = await VocabularySet.findById(req.params.setId);
    if (!vocabSet) {
      return res.status(404).json({ success: false, message: 'Vocabulary set not found' });
    }

    const wordIndex = vocabSet.words.findIndex(w => w._id.toString() === req.params.wordId);
    if (wordIndex === -1) {
      return res.status(404).json({ success: false, message: 'Word not found' });
    }

         // Update word fields
     if (word !== undefined) vocabSet.words[wordIndex].word = word;
     if (definition !== undefined) vocabSet.words[wordIndex].definition = definition;
     if (image !== undefined) vocabSet.words[wordIndex].image = image;
     if (example !== undefined) vocabSet.words[wordIndex].example = example;
     if (order !== undefined) vocabSet.words[wordIndex].order = order;

    const updatedSet = await vocabSet.save();
    res.json({ success: true, vocabSet: updatedSet });
  } catch (error) {
    logger.error('Error updating word in vocabulary set:', error);
    res.status(500).json({ success: false, message: 'Failed to update word' });
  }
});

// Delete word from vocabulary set (Admin only)
router.delete('/sets/:setId/words/:wordId', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const vocabSet = await VocabularySet.findById(req.params.setId);
    if (!vocabSet) {
      return res.status(404).json({ success: false, message: 'Vocabulary set not found' });
    }

    vocabSet.words = vocabSet.words.filter(w => w._id.toString() !== req.params.wordId);
    const updatedSet = await vocabSet.save();

    res.json({ success: true, vocabSet: updatedSet });
  } catch (error) {
    logger.error('Error deleting word from vocabulary set:', error);
    res.status(500).json({ success: false, message: 'Failed to delete word' });
  }
});

// Get all vocabulary sets for admin management
router.get('/admin/sets', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const sets = await VocabularySet.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, vocabSets: sets });
  } catch (error) {
    logger.error('Error fetching vocabulary sets for admin:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vocabulary sets' });
  }
});

module.exports = router;

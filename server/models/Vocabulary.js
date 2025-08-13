const mongoose = require('mongoose');

const vocabularyWordSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    trim: true
  },
  definition: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },


  example: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const vocabularySetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  words: [vocabularyWordSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  studyCount: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Virtual for word count
vocabularySetSchema.virtual('wordCount').get(function() {
  return this.words.length;
});

// Ensure virtual fields are serialized
vocabularySetSchema.set('toJSON', { virtuals: true });
vocabularySetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VocabularySet', vocabularySetSchema);

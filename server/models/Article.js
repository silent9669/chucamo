const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  readingPassage: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  contentType: {
    type: String,
    enum: ['articles', 'books', 'novel', 'scientific research'],
    default: 'articles'
  },
  category: {
    type: String,
    enum: ['math', 'reading', 'writing', 'general', 'tips', 'strategies'],
    default: 'reading'
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  thumbnail: {
    type: String
  },
  images: [{
    type: String
  }],
  readingTime: {
    type: Number,
    default: 0
  },
  wordCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate reading time and word count before saving
ArticleSchema.pre('save', function(next) {
  if (this.content) {
    const text = this.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    const words = text.split(/\s+/).filter(word => word.length > 0);
    this.wordCount = words.length;
    this.readingTime = Math.ceil(words.length / 200); // Assuming 200 words per minute
  }
  next();
});

// Index for better search performance
ArticleSchema.index({ title: 'text', description: 'text', content: 'text' });
ArticleSchema.index({ isPublished: 1, isActive: 1 });
ArticleSchema.index({ category: 1, difficulty: 1 });
ArticleSchema.index({ author: 1 });

module.exports = mongoose.model('Article', ArticleSchema);

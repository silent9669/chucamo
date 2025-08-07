const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test'
  },
  section: {
    type: String,
    trim: true,
    maxlength: [100, 'Section name cannot exceed 100 characters']
  },
  questionNumber: {
    type: Number
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple-choice', 'grid-in', 'essay', 'true-false', 'matching']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  content: {
    type: String,
    required: [true, 'Question content is required'],
    maxlength: [5000, 'Question content cannot exceed 5000 characters']
  },
  passage: {
    type: String,
    maxlength: [10000, 'Passage content cannot exceed 10000 characters']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  options: [{
    letter: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E']
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Option content cannot exceed 1000 characters']
    },
    isCorrect: {
      type: Boolean,
      default: false
    }
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    maxlength: [2000, 'Explanation cannot exceed 2000 characters']
  },
  points: {
    type: Number,
    default: 1
  },
  timeLimit: {
    type: Number, // in seconds
    default: 60
  },
  tags: [{
    type: String,
    trim: true
  }],
  topic: {
    type: String,
    required: true,
    enum: [
      // Math topics
      'Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Probability', 'Functions',
      // Reading topics
      'Literature', 'History', 'Science', 'Social Studies', 'Vocabulary', 'Comprehension',
      // Writing topics
      'Grammar', 'Punctuation', 'Sentence Structure', 'Rhetoric', 'Essay Writing'
    ]
  },
  subTopic: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  },
  averageTimeSpent: {
    type: Number,
    default: 0
  },
  hints: [{
    content: {
      type: String,
      maxlength: [500, 'Hint content cannot exceed 500 characters']
    },
    cost: {
      type: Number,
      default: 0
    }
  }],
  relatedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }]
}, {
  timestamps: true
});

// Validate that multiple choice questions have options
questionSchema.pre('save', function(next) {
  if (this.type === 'multiple-choice' && (!this.options || this.options.length === 0)) {
    return next(new Error('Multiple choice questions must have options'));
  }
  
  if (this.type === 'multiple-choice' && this.options) {
    const correctOptions = this.options.filter(option => option.isCorrect);
    if (correctOptions.length === 0) {
      return next(new Error('Multiple choice questions must have at least one correct answer'));
    }
  }
  
  next();
});

// Index for better query performance
questionSchema.index({ test: 1, section: 1, questionNumber: 1 });
questionSchema.index({ topic: 1, difficulty: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Question', questionSchema); 
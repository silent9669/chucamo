const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in minutes
  },
  score: {
    type: Number,
    min: [400, 'Score must be at least 400'],
    max: [1600, 'Score cannot exceed 1600']
  },
  maxScore: {
    type: Number,
    default: 1600
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage must be at least 0'],
    max: [100, 'Percentage cannot exceed 100']
  },
  passed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'abandoned', 'timeout'],
    default: 'in-progress'
  },
  sectionResults: [{
    section: {
      type: String,
      required: true,
      enum: ['Reading', 'Writing and Language', 'Math (No Calculator)', 'Math (Calculator)']
    },
    score: {
      type: Number,
      min: [200, 'Section score must be at least 200'],
      max: [800, 'Section score cannot exceed 800']
    },
    maxScore: {
      type: Number,
      default: 800
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    timeSpent: {
      type: Number // in minutes
    },
    timeLimit: {
      type: Number // in minutes
    }
  }],
  questionResults: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    userAnswer: {
      type: String
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    timeSpent: {
      type: Number // in seconds
    },
    points: {
      type: Number,
      default: 0
    },
    hintsUsed: [{
      type: Number // index of hint used
    }]
  }],
  analytics: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    incorrectAnswers: {
      type: Number,
      default: 0
    },
    skippedQuestions: {
      type: Number,
      default: 0
    },
    averageTimePerQuestion: {
      type: Number,
      default: 0
    },
    timeManagement: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'fair'
    },
    strengthAreas: [{
      type: String
    }],
    weakAreas: [{
      type: String
    }]
  },
  feedback: {
    type: String,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  },
  isReviewCompleted: {
    type: Boolean,
    default: false
  },
  reviewNotes: {
    type: String,
    maxlength: [2000, 'Review notes cannot exceed 2000 characters']
  }
}, {
  timestamps: true
});

// Calculate score and percentage before saving
resultSchema.pre('save', function(next) {
  if (this.questionResults && this.questionResults.length > 0) {
    // Calculate total correct answers
    this.analytics.correctAnswers = this.questionResults.filter(q => q.isCorrect).length;
    this.analytics.totalQuestions = this.questionResults.length;
    this.analytics.incorrectAnswers = this.questionResults.filter(q => !q.isCorrect && q.userAnswer).length;
    this.analytics.skippedQuestions = this.questionResults.filter(q => !q.userAnswer).length;
    
    // Calculate score (assuming each question is worth equal points)
    const pointsPerQuestion = this.maxScore / this.analytics.totalQuestions;
    this.score = Math.round(this.analytics.correctAnswers * pointsPerQuestion);
    
    // Calculate percentage
    this.percentage = Math.round((this.score / this.maxScore) * 100);
    
    // Determine if passed
    this.passed = this.score >= (this.test?.passingScore || 1000);
    
    // Calculate average time per question
    const totalTime = this.questionResults.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
    this.analytics.averageTimePerQuestion = this.analytics.totalQuestions > 0 
      ? Math.round(totalTime / this.analytics.totalQuestions) 
      : 0;
  }
  
  // Calculate duration if end time is set
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // in minutes
  }
  
  next();
});

// Index for better query performance
resultSchema.index({ user: 1, test: 1, attemptNumber: 1 });
resultSchema.index({ user: 1, createdAt: -1 });
resultSchema.index({ test: 1, score: -1 });
resultSchema.index({ status: 1 });

module.exports = mongoose.model('Result', resultSchema); 
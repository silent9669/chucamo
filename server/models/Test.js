const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
    maxlength: [200, 'Test title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Test description is required'],
    maxlength: [1000, 'Test description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['full', 'math', 'reading', 'writing', 'custom', 'study-plan'],
    required: true
  },
  testType: {
    type: String,
    enum: ['practice', 'study-plan'],
    default: 'practice'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  sections: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Section name cannot exceed 100 characters']
    },
    type: {
      type: String,
      enum: ['english', 'math'],
      default: 'english'
    },
    timeLimit: {
      type: Number, // in minutes
      required: true
    },
    questionCount: {
      type: Number,
      required: true
    },
    instructions: {
      type: String,
      maxlength: [500, 'Instructions cannot exceed 500 characters']
    },
    questions: [{
      id: {
        type: Number,
        required: true
      },
      question: {
        type: String,
        required: true,
        maxlength: [5000, 'Question content cannot exceed 5000 characters']
      },
      content: {
        type: String,
        maxlength: [5000, 'Question content cannot exceed 5000 characters']
      },
      topic: {
        type: String,
        default: 'general'
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'expert'],
        default: 'medium'
      },
      explanation: {
        type: String,
        maxlength: [2000, 'Explanation cannot exceed 2000 characters']
      },
      passage: {
        type: String,
        maxlength: [10000, 'Passage content cannot exceed 10000 characters']
      },
      type: {
        type: String,
        enum: ['multiple-choice', 'grid-in'],
        default: 'multiple-choice'
      },
      options: [{
        content: {
          type: String,
          required: false, // Make content optional since options can be image-only
          maxlength: [1000, 'Option content cannot exceed 1000 characters'],
          default: '' // Provide empty string as default
        },
        images: [{
          url: {
            type: String,
            required: true
          },
          name: {
            type: String,
            required: true
          }
        }],
        isCorrect: {
          type: Boolean,
          default: false
        }
      }],
      correctAnswer: {
        type: String,
        required: true
      },
      images: [{
        url: {
          type: String,
          required: true
        },
        name: {
          type: String,
          required: true
        }
      }],
      answerType: {
        type: String,
        enum: ['multiple-choice', 'written'],
        default: 'multiple-choice'
      },
      writtenAnswer: {
        type: String,
        maxlength: [6, 'Written answer cannot exceed 6 characters']
      },
      acceptableAnswers: [{
        type: String,
        maxlength: [6, 'Acceptable answer cannot exceed 6 characters']
      }]
    }]
  }],
  totalTime: {
    type: Number, // in minutes
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  passingScore: {
    type: Number,
    min: [400, 'Passing score must be at least 400'],
    max: [1600, 'Passing score cannot exceed 1600']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  visibleTo: {
    type: String,
    enum: ['all', 'free', 'premium', 'student', 'mentor', 'admin'],
    default: 'premium', // Default to premium instead of 'all'
    // Visibility levels:
    // 'free' - Accessible to all users (basic practice tests)
    // 'premium' - Requires premium account or higher
    // 'student' - Accessible to student accounts and higher
    // 'mentor' - Accessible to mentor accounts and higher
    // 'admin' - Accessible to admin accounts only
    // 'all' - Accessible to all account types (legacy support)
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  attempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  allowRetakes: {
    type: Boolean,
    default: true
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  showAnswers: {
    type: Boolean,
    default: true
  },
  showExplanations: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate total time and questions from sections
testSchema.pre('save', function(next) {
  if (this.sections && this.sections.length > 0) {
    this.totalTime = this.sections.reduce((total, section) => total + section.timeLimit, 0);
    this.totalQuestions = this.sections.reduce((total, section) => total + section.questionCount, 0);
  }
  next();
});

// Validate that options have either content or images
testSchema.pre('save', function(next) {
  if (this.sections && this.sections.length > 0) {
    for (const section of this.sections) {
      if (section.questions && section.questions.length > 0) {
        for (const question of section.questions) {
          if (question.options && question.options.length > 0) {
            for (const option of question.options) {
              // Check if option has either content or images
              const hasContent = option.content && option.content.trim().length > 0;
              const hasImages = option.images && option.images.length > 0;
              
              if (!hasContent && !hasImages) {
                return next(new Error(`Option in question "${question.question?.substring(0, 50)}..." must have either content or images`));
              }
            }
          }
        }
      }
    }
  }
  next();
});

// Index for better query performance
testSchema.index({ type: 1, difficulty: 1, isActive: 1 });
testSchema.index({ testType: 1, isActive: 1 });
testSchema.index({ visibleTo: 1, isActive: 1 }); // Add index for visibility queries
testSchema.index({ createdBy: 1 });
testSchema.index({ tags: 1 });

module.exports = mongoose.model('Test', testSchema); 
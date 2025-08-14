const mongoose = require('mongoose');

const vocabQuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Quiz title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Quiz description is required'],
    maxlength: [1000, 'Quiz description cannot exceed 1000 characters']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  timeLimit: {
    type: Number, // in minutes
    required: true,
    min: [1, 'Time limit must be at least 1 minute'],
    max: [120, 'Time limit cannot exceed 120 minutes']
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
      enum: ['reading', 'writing'],
      required: true
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
        default: 'vocabulary'
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
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
        enum: ['multiple-choice', 'written'],
        default: 'multiple-choice'
      },
      options: [{
        content: {
          type: String,
          required: false,
          maxlength: [1000, 'Option content cannot exceed 1000 characters'],
          default: ''
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
        maxlength: [100, 'Written answer cannot exceed 100 characters']
      },
      acceptableAnswers: [{
        type: String,
        maxlength: [100, 'Acceptable answer cannot exceed 100 characters']
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
    enum: ['all', 'free', 'student'],
    default: 'all'
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
  },
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  randomizeOptions: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
vocabQuizSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for question count
vocabQuizSchema.virtual('questionCount').get(function() {
  return this.totalQuestions || 0;
});

// Ensure virtual fields are serialized
vocabQuizSchema.set('toJSON', { virtuals: true });
vocabQuizSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('VocabQuiz', vocabQuizSchema);

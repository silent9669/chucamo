const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if oauthProvider is not set (i.e., for traditional users)
      return !this.oauthProvider;
    },
    validate: {
      validator: function(password) {
        // If no password (OAuth user), validation passes
        if (!password) return true;
        // If password exists, it must be at least 6 characters
        return password.length >= 6;
      },
      message: 'Password must be at least 6 characters long'
    },
    select: false
  },
  
  // OAuth fields
  oauthProvider: {
    type: String,
    enum: ['google', 'facebook', 'github'],
    default: null
  },
  oauthId: {
    type: String,
    default: null
  },
  oauthLoginCount: {
    type: Number,
    default: 0
  },
  lastOAuthLogin: {
    type: Date,
    default: null
  },
  oauthPicture: {
    type: String,
    default: null
  },

  role: {
    type: String,
    enum: ['user', 'student', 'admin', 'mentor'],
    default: 'user'
  },
  status: { type: String, default: "active" }, // active | locked
  accountType: {
    type: String,
    enum: ['free', 'premium', 'student', 'mentor', 'admin', 'pro'],
    default: 'free'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  grade: {
    type: Number,
    min: [9, 'Grade must be at least 9'],
    max: [12, 'Grade cannot exceed 12'],
    default: 12
  },
  school: {
    type: String,
    trim: true,
    maxlength: [100, 'School name cannot exceed 100 characters']
  },
  targetScore: {
    type: Number,
    min: [400, 'Target score must be at least 400'],
    max: [1600, 'Target score cannot exceed 1600']
  },
  studyGoals: {
    type: String,
    maxlength: [500, 'Study goals cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  // New fields for tracking
  loginStreak: {
    type: Number,
    default: 0
  },
  lastLoginDate: {
    type: Date,
    default: Date.now
  },
  lastTestCompletionDate: {
    type: Date,
    default: null
  },
    lastCoinEarnedDate: {
    type: Date,
    default: null
  },
  // Track historical test attempts (persists even after deletion)
  historicalTestAttempts: [{
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    attemptsUsed: {
      type: Number,
      default: 0
    },
    lastAttemptDate: {
      type: Date,
      default: Date.now
    }
  }],
  streakBonusUsedToday: {
    type: Boolean,
    default: false
  },
  totalTestsTaken: {
    type: Number,
    default: 0
  },
  averageAccuracy: {
    type: Number,
    default: 0
  },
  coins: {
    type: Number,
    default: 0
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  // Skip password hashing if password is not modified or doesn't exist (for OAuth users)
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  // OAuth users don't have passwords to compare
  if (this.oauthProvider) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Calculate inactivity period
userSchema.virtual('inactivityPeriod').get(function() {
  if (!this.lastLogin) return 'Never logged in';
  
  const now = new Date();
  const lastLogin = new Date(this.lastLogin);
  const diffTime = Math.abs(now - lastLogin);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 
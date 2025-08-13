const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose'); // Added for database connection status
const logger = require('../utils/logger');
// Removed updateLoginStreak and checkAndResetStreakIfNoCoins since streak is now only updated on test completion

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};





// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('grade').optional().isInt({ min: 9, max: 12 }).withMessage('Grade must be between 9 and 12'),
  body('school').optional().trim().isLength({ max: 100 }).withMessage('School name cannot exceed 100 characters'),
  body('targetScore').optional().isInt({ min: 400, max: 1600 }).withMessage('Target score must be between 400 and 1600')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { firstName, lastName, username, email, password, grade, school, targetScore, studyGoals } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username }
      ]
    });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'User already exists with this email' });
      } else {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
      grade,
      school,
      targetScore,
      studyGoals
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        grade: user.grade,
        school: user.school,
        targetScore: user.targetScore,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user with username or email
// @access  Public
router.post('/login', [
  body('username').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;

    // Check if user exists by username or email
    logger.debug('🔍 Looking for user with:', username);
    logger.debug('🔍 Database connection status:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected');
    
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username.toLowerCase() }
      ]
    }).select('+password');
    
    if (!user) {
      logger.warn('❌ User not found:', username);
      // Let's also check if there are any users in the database
      const totalUsers = await User.countDocuments();
      logger.debug('🔍 Total users in database:', totalUsers);
      
      // Check for any admin users
      const adminUsers = await User.find({ role: 'admin' });
      logger.debug('🔍 Admin users in database:', adminUsers.map(u => ({ username: u.username, email: u.email })));
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    logger.info('✅ User found:', user.username, 'Role:', user.role);

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('❌ Password mismatch for user:', user.username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    logger.info('✅ Password verified for user:', user.username);

    // Update last login (streak is now only updated on test completion)
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        grade: user.grade,
        school: user.school,
        targetScore: user.targetScore,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
        loginStreak: user.loginStreak,
        totalTestsTaken: user.totalTestsTaken,
        averageAccuracy: user.averageAccuracy,
        coins: user.coins,
        lastTestCompletionDate: user.lastTestCompletionDate
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/google
// @desc    Authenticate user with Google
// @access  Public
router.post('/google', [
  body('credential').notEmpty().withMessage('Google credential is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { credential } = req.body;
    
    // Ensure Buffer is available
    if (typeof Buffer === 'undefined') {
      logger.error('Buffer is not available');
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    // Decode the Google ID token - handle both JWT format and our custom base64 format
    let payload;
    try {
      // First try to decode as JWT (original Google ID token format)
      if (credential.includes('.')) {
        payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
      } else {
        // If that fails, try to decode as our custom base64 format
        const decodedString = Buffer.from(credential, 'base64').toString('utf8');
        payload = JSON.parse(decodedString);
      }
    } catch (decodeError) {
      logger.error('Failed to decode credential:', decodeError);
      return res.status(400).json({ message: 'Invalid credential format' });
    }
    
    const { email, given_name, family_name, name, picture, sub: googleId, email_verified } = payload;

    logger.debug('Google authentication attempt for:', email);

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { googleId: googleId }
      ]
    });

    if (!user) {
      // Create new user with free account
      const firstName = given_name || name?.split(' ')[0] || 'User';
      const lastName = family_name || name?.split(' ').slice(1).join(' ') || '';
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);

      user = await User.create({
        firstName,
        lastName,
        username,
        email: email.toLowerCase(),
        password: 'google-auth-' + Math.random().toString(36).substr(2, 15),
        googleId,
        profilePicture: picture,
        emailVerified: email_verified || true,
        isActive: true,
        role: 'user',
        accountType: 'free',
        // Set default values for free account
        grade: 12, // Default grade
        school: 'Not specified',
        targetScore: 1200, // Default target score
        loginStreak: 1,
        totalTestsTaken: 0,
        averageAccuracy: 0,
        coins: 100, // Starting coins for free users
        lastTestCompletionDate: null,
        createdAt: new Date(),
        lastLogin: new Date(),
        // Add additional fields for user management
        studyGoals: 'Improve SAT score through practice',
        lastLoginDate: new Date()
      });

      logger.info('✅ New Google user created with free account:', {
        username: user.username,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        coins: user.coins
      });
    } else {
      // Update existing user
      if (!user.googleId) {
        user.googleId = googleId;
        logger.info('✅ Updated existing user with Google ID:', user.username);
      }
      
      // Update profile picture if available
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
      }
      
      // Update last login and streak
      user.lastLogin = new Date();
      user.lastLoginDate = new Date();
      user.loginStreak = (user.loginStreak || 0) + 1;
      
      await user.save();
      logger.info('✅ Updated existing Google user:', user.username);
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data
    res.json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        grade: user.grade,
        school: user.school,
        targetScore: user.targetScore,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
        loginStreak: user.loginStreak,
        totalTestsTaken: user.totalTestsTaken,
        averageAccuracy: user.averageAccuracy,
        coins: user.coins,
        lastTestCompletionDate: user.lastTestCompletionDate,
        isGoogleUser: true,
        googleId: user.googleId
      }
    });
  } catch (error) {
    logger.error('Google authentication error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        grade: user.grade,
        school: user.school,
        targetScore: user.targetScore,
        studyGoals: user.studyGoals,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
        emailVerified: user.emailVerified,
        loginStreak: user.loginStreak || 0,
        totalTestsTaken: user.totalTestsTaken || 0,
        averageAccuracy: user.averageAccuracy || 0,
        coins: user.coins || 0,
        lastTestCompletionDate: user.lastTestCompletionDate
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('grade').optional().isInt({ min: 9, max: 12 }).withMessage('Grade must be between 9 and 12'),
  body('school').optional().trim().isLength({ max: 100 }).withMessage('School name cannot exceed 100 characters'),
  body('targetScore').optional().isInt({ min: 400, max: 1600 }).withMessage('Target score must be between 400 and 1600'),
  body('studyGoals').optional().trim().isLength({ max: 500 }).withMessage('Study goals cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { firstName, lastName, grade, school, targetScore, studyGoals } = req.body;

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        grade,
        school,
        targetScore,
        studyGoals
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        grade: user.grade,
        school: user.school,
        targetScore: user.targetScore,
        studyGoals: user.studyGoals,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

module.exports = router; 
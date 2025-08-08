const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Verify Google ID Token
const verifyGoogleToken = async (idToken) => {
  try {
    console.log('Verifying Google ID token...');
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID environment variable not set');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    console.log('Google token verified successfully for user:', payload.email);
    
    return payload;
  } catch (error) {
    console.error('Google token verification error:', error);
    
    if (error.message.includes('GOOGLE_CLIENT_ID')) {
      throw new Error('Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable.');
    }
    
    if (error.message.includes('Invalid token')) {
      throw new Error('Invalid Google token provided');
    }
    
    throw new Error(`Google token verification failed: ${error.message}`);
  }
};

// @route   POST /api/auth/google
// @desc    Google Sign-In authentication
// @access  Public
router.post('/google', [
  body('idToken').notEmpty().withMessage('Google ID token is required')
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

    const { idToken } = req.body;

    // Verify Google token with Google's servers
    const payload = await verifyGoogleToken(idToken);
    
    const { email, given_name: firstName, family_name: lastName, picture: profilePicture, sub: googleId } = payload;

    // Check if user exists by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists, update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.profilePicture = profilePicture || user.profilePicture;
        await user.save();
      }
    } else {
      // Create new user
      const username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
      
      user = await User.create({
        firstName: firstName || 'Google',
        lastName: lastName || 'User',
        email: email.toLowerCase(),
        username,
        googleId,
        profilePicture,
        password: Math.random().toString(36).substr(2, 15), // Random password for Google users
        emailVerified: true, // Google emails are verified
        accountType: 'free' // Default to free account
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Google Sign-In successful',
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
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Google Sign-In error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('GOOGLE_CLIENT_ID')) {
      return res.status(500).json({ 
        message: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable.' 
      });
    }
    
    if (error.message.includes('Invalid token')) {
      return res.status(400).json({ 
        message: 'Invalid Google token. Please try signing in again.' 
      });
    }
    
    if (error.message.includes('audience')) {
      return res.status(400).json({ 
        message: 'Google Client ID mismatch. Please check your configuration.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error during Google Sign-In',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

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
    console.log('🔍 Looking for user with:', username);
    const user = await User.findOne({
      $or: [
        { username: username },
        { email: username.toLowerCase() }
      ]
    }).select('+password');
    
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('✅ User found:', user.username, 'Role:', user.role);

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', user.username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('✅ Password verified for user:', user.username);

    // Update login streak and last login
    const now = new Date();
    const lastLoginDate = user.lastLoginDate || new Date(0);
    const daysSinceLastLogin = Math.floor((now - lastLoginDate) / (1000 * 60 * 60 * 24));
    
    // Update login streak
    if (daysSinceLastLogin === 1) {
      user.loginStreak += 1;
    } else if (daysSinceLastLogin > 1) {
      user.loginStreak = 1;
    } else if (daysSinceLastLogin === 0 && user.loginStreak === 0) {
      user.loginStreak = 1;
    }
    
    user.lastLogin = now;
    user.lastLoginDate = now;
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
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
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
        coins: user.coins || 0
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
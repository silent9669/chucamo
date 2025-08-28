const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const { protect } = require('../middleware/auth');
const checkSession = require('../middleware/checkSession');
const mongoose = require('mongoose'); // Added for database connection status
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
// Removed updateLoginStreak and checkAndResetStreakIfNoCoins since streak is now only updated on test completion

const router = express.Router();

// Rate limiter specifically for login endpoint to prevent DDoS
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: (req) => {
    // Use IP address for rate limiting
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded for login:', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    res.status(429).json({
      success: false,
      message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

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
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user with username or email
// @access  Public
router.post('/login', loginRateLimiter, [
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

    // Check if account is locked
    if (user.status === "locked") {
      return res.status(403).json({ message: "Account locked. Contact admin." });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('❌ Password mismatch for user:', user.username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    logger.info('✅ Password verified for user:', user.username);

          // Count active sessions (only for student accounts)
      if (user.accountType === 'student') {
        const activeSessions = await Session.find({ userId: user._id });
        if (activeSessions.length >= 2) {
          // Lock account
          user.status = "locked";
          await user.save();
          return res.status(403).json({ message: "Account locked due to multiple devices" });
        }
      }

    // Create new session
    const sessionId = uuidv4();
    const deviceInfo = req.headers["user-agent"] || "Unknown";
    const ip = req.ip || req.connection.remoteAddress;

    await Session.create({
      userId: user._id,
      sessionId,
      deviceInfo,
      ip
    });

    // Update last login (streak is now only updated on test completion)
    user.lastLogin = new Date();
    await user.save();

    // Generate token with session ID
    const token = jwt.sign(
      { id: user._id, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

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
    logger.error('Get user error:', error);
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
    logger.error('Profile update error:', error);
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
    logger.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user and remove session
// @access  Private
router.post('/logout', checkSession, async (req, res) => {
  try {
    if (req.session && req.session.sessionId) {
      await Session.deleteOne({ sessionId: req.session.sessionId });
    }
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// @route   GET /api/auth/google
// @desc    Google OAuth login - Redirects to Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback - Handles user creation/login
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  async (req, res) => {
    try {
      const user = req.user;

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Check if account is locked
      if (user.status === "locked") {
        return res.status(403).json({ message: "Account locked. Contact admin." });
      }

      // Count active sessions (only for student accounts)
      if (user.accountType === 'student') {
        const activeSessions = await Session.find({ userId: user._id });
        if (activeSessions.length >= 2) {
          // Lock account
          user.status = "locked";
          await user.save();
          return res.status(403).json({ message: "Account locked due to multiple devices" });
        }
      }

      // Create new session with OAuth data
      const sessionId = uuidv4();
      const deviceInfo = req.headers["user-agent"] || "Unknown";
      const ip = req.ip || req.connection.remoteAddress;

      await Session.create({
        userId: user._id,
        sessionId,
        deviceInfo,
        ip,
        oauthProvider: 'google',
        oauthId: user.oauthId,
        loginMethod: 'oauth'
      });

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token with session ID
      const token = jwt.sign(
        { id: user._id, sessionId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Redirect to frontend with token
      const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/oauth-callback?token=${token}&provider=google`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }
);

// @route   POST /api/auth/google/token
// @desc    Handle client-side Google OAuth token
// @access  Public
router.post('/google/token', async (req, res) => {
  try {
    const { id_token } = req.body;
    
    if (!id_token) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID token is required' 
      });
    }

    // Verify the ID token with Google
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name } = payload;

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { oauthId: googleId, oauthProvider: 'google' },
        { email }
      ]
    });

    if (user) {
      // Update existing user's OAuth info if needed
      if (!user.oauthProvider || user.oauthProvider !== 'google') {
        user.oauthProvider = 'google';
        user.oauthId = googleId;
        user.emailVerified = true;
        await user.save();
      }

      // Update OAuth login stats
      user.lastOAuthLogin = new Date();
      user.oauthLoginCount = (user.oauthLoginCount || 0) + 1;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        firstName: given_name || 'Unknown',
        lastName: family_name || 'User',
        username: `google_${googleId}`,
        email,
        oauthProvider: 'google',
        oauthId: googleId,
        emailVerified: true,
        accountType: 'free',
        role: 'user',
        lastOAuthLogin: new Date(),
        oauthLoginCount: 1
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    // Check if account is locked
    if (user.status === "locked") {
      return res.status(403).json({ 
        success: false, 
        message: "Account locked. Contact admin." 
      });
    }

    // Count active sessions (only for student accounts)
    if (user.accountType === 'student') {
      const activeSessions = await Session.find({ userId: user._id });
      if (activeSessions.length >= 2) {
        user.status = "locked";
        await user.save();
        return res.status(403).json({ 
          success: false, 
          message: "Account locked due to multiple devices" 
        });
      }
    }

    // Create new session
    const sessionId = uuidv4();
    const deviceInfo = req.headers["user-agent"] || "Unknown";
    const ip = req.ip || req.connection.remoteAddress;

    await Session.create({
      userId: user._id,
      sessionId,
      deviceInfo,
      ip,
      oauthProvider: 'google',
      oauthId: user.oauthId,
      loginMethod: 'oauth'
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

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
        accountType: user.accountType
      }
    });

  } catch (error) {
    logger.error('Google token verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
});

// @route   GET /api/auth/oauth-status
// @desc    Check OAuth authentication status
// @access  Public
router.get('/oauth-status', (req, res) => {
  res.json({
    success: true,
    message: 'OAuth routes are configured',
    google: 'Available (Client-side)',
    facebook: 'Not implemented yet'
  });
});

module.exports = router; 
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback",
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info('Google OAuth callback received:', {
      googleId: profile.id,
      email: profile.emails[0]?.value
    });

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { oauthId: profile.id, oauthProvider: 'google' },
        { email: profile.emails[0]?.value }
      ]
    });

    if (user) {
      // Update existing user's OAuth info if needed
      if (!user.oauthProvider || user.oauthProvider !== 'google') {
        user.oauthProvider = 'google';
        user.oauthId = profile.id;
        user.oauthProfile = profile;
        user.emailVerified = true; // Google emails are verified
        await user.save();
        logger.info('Updated existing user with Google OAuth:', user.email);
      }

      // Update OAuth login stats
      user.lastOAuthLogin = new Date();
      user.oauthLoginCount = (user.oauthLoginCount || 0) + 1;
      await user.save();

      return done(null, user);
    }

    // Create new user
    const newUser = await User.create({
      firstName: profile.name.givenName || 'Unknown',
      lastName: profile.name.familyName || 'User',
      username: `google_${profile.id}`,
      email: profile.emails[0]?.value,
      oauthProvider: 'google',
      oauthId: profile.id,
      oauthProfile: profile,
      emailVerified: true,
      accountType: 'free', // Default to free account
      role: 'user',
      lastOAuthLogin: new Date(),
      oauthLoginCount: 1
    });

    logger.info('Created new user via Google OAuth:', newUser.email);
    return done(null, newUser);
  } catch (error) {
    logger.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

module.exports = passport;

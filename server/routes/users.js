const express = require('express');
const User = require('../models/User');
const Session = require('../models/Session');
const Result = require('../models/Result');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard of users with most tests taken
// @access  Private
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get current user to determine account type filter
    const currentUser = await User.findById(req.user.id);
    const accountTypeFilter = currentUser.accountType;
    
    // Aggregate users with their test counts, filtered by account type
    // Exclude teacher and admin accounts from leaderboard
    const leaderboard = await Result.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $match: {
          $and: [
            { 'userInfo.accountType': accountTypeFilter },

                         { 'userInfo.accountType': { $ne: 'admin' } } // Exclude admin accounts from leaderboard
          ]
        }
      },
      {
        $group: {
          _id: '$user',
          testCount: { $sum: 1 },
          averageScore: { $avg: '$score' },
          bestScore: { $max: '$score' },
          averageAccuracy: { $avg: '$accuracy' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: '$userInfo._id',
          firstName: '$userInfo.firstName',
          lastName: '$userInfo.lastName',
          username: '$userInfo.username',
          profilePicture: '$userInfo.profilePicture',
          accountType: '$userInfo.accountType',
          coins: '$userInfo.coins',
          testCount: 1,
          averageScore: { $round: ['$averageScore', 1] },
          bestScore: 1
        }
      },
      {
        $sort: { coins: -1, testCount: -1, averageScore: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({
      success: true,
      users: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only) or leaderboard (public)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, accountType, search, sort = 'createdAt' } = req.query;
    
    // If sort is testCount, return leaderboard instead
    if (sort === 'testCount') {
      return res.redirect('/api/users/leaderboard');
    }
    
    // Admin only for other operations
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    let query = {};
    if (accountType) query.accountType = accountType;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add test statistics, activity status, and device count for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const testCount = await Result.countDocuments({ user: user._id, status: 'completed' });
      
      // Get device count from sessions (only for student accounts)
      const deviceCount = user.accountType === 'student' ? await Session.countDocuments({ userId: user._id }) : 0;
      
      // Calculate activity status
      let activityStatus = 'Never logged in';
      let lastActiveHours = null;
      let isActive = false;
      
      if (user.lastLogin) {
        const now = new Date();
        const lastLogin = new Date(user.lastLogin);
        const diffTime = Math.abs(now - lastLogin);
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        
        if (diffHours < 1) {
          activityStatus = 'Active now';
          isActive = true;
        } else if (diffHours < 24) {
          activityStatus = `${diffHours} hours ago`;
          lastActiveHours = diffHours;
          isActive = diffHours < 7; // Consider active if less than 7 hours
        } else if (diffHours < 168) { // 7 days
          const days = Math.floor(diffHours / 24);
          activityStatus = `${days} days ago`;
          isActive = days < 3; // Consider active if less than 3 days
        } else {
          const weeks = Math.floor(diffHours / 168);
          activityStatus = `${weeks} weeks ago`;
          isActive = false;
        }
      }
      
      return {
        ...user,
        testCount,
        deviceCount,
        activityStatus,
        lastActiveHours,
        isActive
      };
    }));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user account type (admin only)
// @access  Private
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { accountType } = req.body;

    // Check if user exists and get their current role
    const existingUser = await User.findById(req.params.id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent editing admin accounts
    if (existingUser.accountType === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be edited' });
    }

    // Only allow updating account type, not role or status
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountType },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'User account type updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/unlock
// @desc    Unlock user account (admin only)
// @access  Private
router.post('/:id/unlock', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.accountType === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be unlocked' });
    }

    if (user.accountType !== 'student') {
      return res.status(400).json({ message: 'Only student accounts can be unlocked' });
    }

    // Unlock the account
    user.status = 'active';
    await user.save();

    res.json({
      success: true,
      message: 'User account unlocked successfully',
      user: {
        _id: user._id,
        status: user.status,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Unlock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/reactivate
// @desc    Reactivate user account and reset sessions (admin only)
// @access  Private
router.post('/:id/reactivate', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.accountType === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be reactivated' });
    }

    if (user.accountType !== 'student') {
      return res.status(400).json({ message: 'Only student accounts can be reactivated' });
    }

    // Reactivate the account
    user.status = 'active';
    await user.save();

    // Reset all sessions for this user
    await Session.deleteMany({ userId: user._id });

    res.json({
      success: true,
      message: 'User account reactivated and sessions reset successfully',
      user: {
        _id: user._id,
        status: user.status,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/sessions
// @desc    Get user sessions with device info (admin only)
// @access  Private
router.get('/:id/sessions', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.accountType !== 'student') {
      return res.status(400).json({ message: 'Only student accounts have device sessions' });
    }

    // Get all sessions for this user
    const sessions = await Session.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status
      },
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        deviceInfo: session.deviceInfo,
        ip: session.ip,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity || session.createdAt
      }))
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.accountType === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
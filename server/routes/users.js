const express = require('express');
const User = require('../models/User');
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
            { 'userInfo.accountType': { $ne: 'teacher' } }, // Exclude teacher accounts from leaderboard
            { 'userInfo.role': { $ne: 'admin' } } // Exclude admin accounts from leaderboard
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
    const { page = 1, limit = 20, role, accountType, search, sort = 'createdAt' } = req.query;
    
    // If sort is testCount, return leaderboard instead
    if (sort === 'testCount') {
      return res.redirect('/api/users/leaderboard');
    }
    
    // Admin only for other operations
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    let query = {};
    if (role) query.role = role;
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

    // Add test statistics for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const testCount = await Result.countDocuments({ user: user._id, status: 'completed' });
      return {
        ...user,
        testCount
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
// @desc    Update user (admin only)
// @access  Private
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, accountType, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, accountType, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
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

    if (user.role === 'admin') {
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
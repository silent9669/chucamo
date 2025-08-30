import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  FiBookOpen,
  FiBarChart2, 
  FiTarget,
  FiTrendingUp,
  FiAward,
  FiDollarSign
} from 'react-icons/fi';
import { resultsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import logger from '../../utils/logger';

const Dashboard = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({
    loginStreak: 0,
    totalTestsTaken: 0,
    averageAccuracy: 0,
    ranking: 0,
    coins: 0
  });

  
  const { isLoading, error } = useQuery(
    'analytics',
    () => resultsAPI.getAnalytics(),
    {
      refetchOnWindowFocus: false,
    }
  );

  const fetchUserStats = useCallback(async () => {
    try {
      // Always fetch fresh data to ensure coins, accuracy, and login streak are up to date
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const currentUser = data.user;
        
        setUserStats({
          loginStreak: currentUser?.loginStreak || 0,
          totalTestsTaken: currentUser?.totalTestsTaken || 0,
          averageAccuracy: currentUser?.averageAccuracy || 0,
          ranking: 0, // Will be calculated from leaderboard
          coins: currentUser?.coins || 0
        });
      } else {
        // Fallback to user data from context if fetch fails
        setUserStats({
          loginStreak: user?.loginStreak || 0,
          totalTestsTaken: user?.totalTestsTaken || 0,
          averageAccuracy: user?.averageAccuracy || 0,
          ranking: 0,
          coins: user?.coins || 0
        });
      }
    } catch (error) {
      logger.error('Error fetching user stats:', error);
      // Fallback to user data from context if fetch fails
      setUserStats({
        loginStreak: user?.loginStreak || 0,
        totalTestsTaken: user?.totalTestsTaken || 0,
        averageAccuracy: user?.averageAccuracy || 0,
        ranking: 0,
        coins: user?.coins || 0
      });
    }
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/users/leaderboard?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Calculate user's ranking
        const userRanking = data.users.findIndex(u => u._id === user?.id) + 1;
        setUserStats(prev => ({
          ...prev,
          ranking: userRanking > 0 ? userRanking : 0
        }));
      }
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchLeaderboard();
    }
  }, [user, fetchUserStats, fetchLeaderboard]);

  const quickActions = [
    {
      title: 'Take Practice Test',
      description: 'Start a new full-length SAT practice test',
      icon: FiBookOpen,
      href: '/tests',
      color: 'bg-primary-500',
      textColor: 'text-primary-600'
    },
    {
      title: 'View Results',
      description: 'Check your recent test results and analytics',
      icon: FiBarChart2,
      href: '/results',
      color: 'bg-success-500',
      textColor: 'text-success-600'
    },
    {
      title: 'SAT Score Calculator',
      description: 'Calculate your estimated SAT score and track your progress',
      icon: FiBarChart2,
      href: '/sat-score-calculator',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-primary-100">
          Ready to continue your SAT preparation journey?
        </p>
        {user?.targetScore ? (
          <div className="mt-4 flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
            <FiTarget className="w-5 h-5 text-yellow-300" />
            <span className="font-medium">Target Score: {user.targetScore}</span>
          </div>
        ) : (
          <div className="mt-4 flex items-center space-x-2 text-primary-200">
            <FiTarget className="w-5 h-5" />
            <span>No target score set yet</span>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Login Streak */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Login Streak</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.loginStreak}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">🔥</span>
            </div>
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ranking</p>
              <p className="text-2xl font-bold text-gray-900">
                {userStats.ranking > 0 ? `#${userStats.ranking}` : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiAward className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Coins */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Coins Earned</p>
              <p className="text-2xl font-bold text-gray-900">🪙 {userStats.coins}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiDollarSign className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">
                {userStats.averageAccuracy ? userStats.averageAccuracy.toFixed(1) : '0.0'}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  to={action.href}
                  className="group block p-6 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-medium transition-all duration-200"
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${action.color} bg-opacity-10`}>
                      <Icon className={`w-6 h-6 ${action.textColor}`} />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Study Tips */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Study Tips</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📚 Daily Practice</h3>
              <p className="text-blue-800 text-sm">
                Consistency is key! Try to practice for at least 30 minutes every day to maintain momentum.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">🎯 Focus on Weak Areas</h3>
              <p className="text-green-800 text-sm">
                Use your analytics to identify weak areas and focus your study time on improving them.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">⏰ Time Management</h3>
              <p className="text-yellow-800 text-sm">
                Practice with realistic timing to improve your time management skills during the actual test.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">📊 Review Mistakes</h3>
              <p className="text-purple-800 text-sm">
                Always review your incorrect answers to understand where you went wrong and learn from mistakes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
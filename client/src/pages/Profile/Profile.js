import React, { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    school: '',
    grade: '',
    targetScore: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [leaderboard, setLeaderboard] = useState([]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLeaderboardLoading(true);
      const response = await fetch('/api/users/leaderboard?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.users || []);
      } else {
        setLeaderboard([]);
      }
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Single useEffect to handle user data updates
  useEffect(() => {
    if (user) {
      console.log('Profile: User context updated:', user);
      console.log('Profile: User account type from context:', user.accountType);
      console.log('Profile: User OAuth provider:', user.oauthProvider);
      console.log('Profile: User OAuth picture:', user.oauthPicture);
      console.log('Profile: Full user object:', JSON.stringify(user, null, 2));
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        targetScore: user.targetScore || ''
      });
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Separate useEffect for leaderboard to prevent infinite loops
  useEffect(() => {
    if (user) {
      fetchLeaderboard();
    }
  }, [user?.id, fetchLeaderboard]); // eslint-disable-line react-hooks/exhaustive-deps





  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Only update target score since other fields are read-only
      const updateData = {
        targetScore: profileData.targetScore
      };
      
      const response = await authAPI.updateProfile(updateData);
      if (response.data) {
        // Update the user context with the new target score
        updateUser({ targetScore: profileData.targetScore });
        setMessage({ type: 'success', text: 'Target score updated successfully!' });
        setIsEditing(false); // Exit edit mode after successful save
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update target score' 
      });
    } finally {
      setLoading(false);
    }
  };





  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account and view your progress</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Profile Picture Display */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-shrink-0">
                  {user?.oauthPicture ? (
                    <img
                      src={user.oauthPicture}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-100">
                      {getInitials(user?.firstName, user?.lastName)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
                  {user?.oauthProvider && (
                    <p className="text-sm text-gray-500 mt-1">Google Account</p>
                  )}
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {/* Message Display */}
              {message.text && (
                <div className={`mb-4 p-3 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleProfileUpdate}>
                 <div className="grid md:grid-cols-2 gap-6">
                   {/* First Name - Always read-only for OAuth users */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                     <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                       {profileData.firstName}
                     </div>
                   </div>
                   
                   {/* Last Name - Always read-only for OAuth users */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                     <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                       {profileData.lastName}
                     </div>
                   </div>
                   
                   {/* Email - Always read-only for OAuth users */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                     <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                       {profileData.email}
                     </div>
                   </div>
                   
                   {/* Target SAT Score - Editable when in edit mode */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">Target SAT Score</label>
                     {isEditing ? (
                       <input
                         type="number"
                         value={profileData.targetScore || ''}
                         onChange={(e) => setProfileData(prev => ({ ...prev, targetScore: e.target.value ? parseInt(e.target.value) : '' }))}
                         min="400"
                         max="1600"
                         placeholder="e.g., 1200"
                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                       />
                     ) : (
                       <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                         {profileData.targetScore || 'Not set'}
                       </div>
                     )}
                   </div>
                   
                   {/* Account Type - Read-only for all users */}
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                     <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                       {user?.accountType === 'student' ? 'Student Account' : 
                         user?.accountType === 'free' ? 'Free Account' : 
                         user?.accountType === 'mentor' ? 'Mentor Account' : 
                         user?.accountType === 'pro' ? 'Pro Account' : 
                         user?.accountType === 'admin' ? 'Admin Account' : 'Unknown'}
                     </div>
                   </div>
                 </div>

                {/* Show save button only when editing */}
                {isEditing && (
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>




          </div>

          {/* Right Column - Leaderboard */}
          <div className="space-y-6">

            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Leaderboard</h2>
              {leaderboardLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg animate-pulse">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((user, index) => (
                    <div key={user._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {index < 3 ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            'bg-orange-500'
                          }`}>
                            {index + 1}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {user.oauthPicture ? (
                            <img
                              src={user.oauthPicture}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            getInitials(user.firstName, user.lastName)
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {`${user.firstName} ${user.lastName}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          🪙 {user.coins || 0} coins
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {/* Removed login streak display */}
                      </div>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No test data available yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 
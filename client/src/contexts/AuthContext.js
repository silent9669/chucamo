import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import logger from '../utils/logger';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null, // Will be null initially, will be set from cookies
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Helper function to get token from cookies only
  const getAuthToken = () => {
    const cookies = document.cookie.split(';');
    const jwtCookie = cookies.find(cookie => cookie.trim().startsWith('jwt='));
    
    if (jwtCookie) {
      const token = jwtCookie.split('=')[1];
      logger.debug('Token found in cookies');
      return token;
    }
    
    logger.debug('No token found in cookies');
    return null;
  };

  // Helper function to clear authentication data
  const clearAuthData = () => {
    // Clear cookies by setting expired cookie
    document.cookie = 'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    logger.debug('Authentication cookies cleared');
  };

  // Set auth token in axios headers (for backward compatibility)
  useEffect(() => {
    if (state.token) {
      authAPI.setAuthToken(state.token);
    } else {
      authAPI.removeAuthToken();
    }
  }, [state.token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authAPI.getCurrentUser();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: response.data.user, token: token }
          });
        } catch (error) {
          logger.error('Session validation failed:', error);
          // Clear invalid authentication data
          clearAuthData();
          dispatch({
            type: 'AUTH_FAILURE',
            payload: 'Session expired. Please login again.'
          });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password, googleData = null) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      let response;
      if (googleData && googleData.isGoogleUser) {
        // Handle Google authentication
        response = await authAPI.googleAuth(googleData);
      } else {
        // Handle regular login
        response = await authAPI.login(email, password);
      }
      
      // Get token from response (for UI state management)
      const token = response.data.token;
      
      // Token is automatically set as httpOnly cookie by server
      // We use the token from response for UI state only
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user,
          token: token
        }
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };



  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.register(userData);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Call server logout to clear cookies
      await authAPI.logout();
    } catch (error) {
      logger.warn('Server logout failed, clearing local data anyway:', error);
    }
    
    // Clear all local authentication data
    clearAuthData();
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.user
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      return { success: false, error: message };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user,
          token: state.token
        }
      });
      return { success: true };
    } catch (error) {
      logger.error('Error refreshing user data:', error);
      return { success: false, error: 'Failed to refresh user data' };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
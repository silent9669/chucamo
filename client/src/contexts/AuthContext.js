import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import logger from '../utils/logger';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
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

  // Set auth token in axios headers
  useEffect(() => {
    if (state.token) {
      authAPI.setAuthToken(state.token);
      localStorage.setItem('token', state.token);
    } else {
      authAPI.removeAuthToken();
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authAPI.getCurrentUser();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user: response.data.user, token: state.token }
          });
        } catch (error) {
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
  }, [state.token]);

  // Session state monitoring for OAuth users
  useEffect(() => {
    if (state.user?.oauthProvider && window.google?.accounts?.id) {
      const handleCredentialResponse = (response) => {
        console.log('🔍 OAuth session state changed:', response);
        // Handle session state changes
        if (response.credential) {
          // User is still signed in
          console.log('✅ User OAuth session is still valid');
        } else {
          // User signed out
          console.log('❌ User OAuth session expired');
          dispatch({ type: 'LOGOUT' });
        }
      };

      // Listen for credential changes
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false
      });

      // Monitor session state
      const checkSessionState = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                console.log('🔍 OAuth session state:', notification);
              }
            });
          } catch (error) {
            console.log('🔍 OAuth session check error:', error);
          }
        }
      };

      // Check session state every 5 minutes
      const sessionInterval = setInterval(checkSessionState, 5 * 60 * 1000);
      
      return () => {
        clearInterval(sessionInterval);
      };
    }
  }, [state.user]);

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
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token
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

  const logout = () => {
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

  const loginWithGoogle = async (idToken, accessToken) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Ensure the API URL includes /api suffix
      let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      if (!apiUrl.endsWith('/api')) {
        apiUrl = apiUrl.endsWith('/') ? apiUrl + 'api' : apiUrl + '/api';
      }
      // Prepare request body based on token type
      const requestBody = accessToken 
        ? { access_token: accessToken }
        : { id_token: idToken };
      
      const response = await fetch(`${apiUrl}/auth/google/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google login failed');
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: data.user,
            token: data.token
          }
        });
        return { success: true };
      } else {
        throw new Error(data.message || 'Google login failed');
      }
    } catch (error) {
      const message = error.message || 'Google login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, message };
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
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
    loginWithGoogle,
    updateUser,
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
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import Button from '../../components/UI/Button';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleGoogleSignIn = useCallback(async (response) => {
    setGoogleLoading(true);
    try {
      console.log('🔐 Google Sign-In response received');
      
      // Decode the ID token to get user information
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('Decoded payload:', payload);
      
      // Extract user information
      const userData = {
        email: payload.email,
        firstName: payload.given_name || payload.name?.split(' ')[0] || 'User',
        lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
        profilePicture: payload.picture,
        googleId: payload.sub,
        emailVerified: payload.email_verified || true
      };
      
      console.log('Extracted user data:', userData);
      
      // Send the credential to the backend
      const result = await googleLogin(response.credential);
      
      if (result.success) {
        toast.success(`Welcome back, ${userData.firstName}!`);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        toast.error(result.error || 'Google Sign-In failed');
      }
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      toast.error('Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLogin, navigate]);

  // Simple Google initialization
  useEffect(() => {
    const initGoogle = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        console.log('✅ Google Sign-In ready');
        
        // Clean up any existing instances first
        try {
          if (window.google.accounts.id.cancel) {
            window.google.accounts.id.cancel();
          }
        } catch (error) {
          console.log('⚠️ Google cleanup error:', error);
        }
        
        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        
        console.log('✅ Google Sign-In re-initialized');
      } else {
        setTimeout(initGoogle, 100);
      }
    };
    
    initGoogle();
    
    // Cleanup function to cancel Google session when component unmounts
    return () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.cancel();
          console.log('✅ Google session cleaned up on unmount');
        } catch (error) {
          console.log('⚠️ Google cleanup error on unmount:', error);
        }
      }
    };
  }, [handleGoogleSignIn]);

  const handleGoogleButtonClick = () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      toast.error('Google Sign-In is not ready yet. Please wait a moment.');
      return;
    }

    try {
      console.log('🚀 Triggering Google Sign-In...');
      
      // Force re-initialization to ensure fresh state
      try {
        window.google.accounts.id.cancel();
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        console.log('✅ Google Sign-In re-initialized before prompt');
      } catch (error) {
        console.log('⚠️ Re-initialization error:', error);
      }
      
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error('❌ Error with Google Sign-In:', error);
      toast.error('Failed to open Google Sign-In. Please try again.');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {/* Google Sign-In Button */}
        <div className="mt-6">
          <button
            onClick={handleGoogleButtonClick}
            disabled={googleLoading}
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            {googleLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="font-medium">Signing in...</span>
              </div>
            ) : (
              <>
                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-semibold text-gray-800">Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Username or Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  required
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your username or email"
                  {...register('email', {
                    required: 'Username or email is required'
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            Sign in
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            New to chucamo?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Create your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 
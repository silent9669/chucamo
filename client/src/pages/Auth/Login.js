import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Google OAuth client-side library
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '222187587627-bt14cg9demfolkdd08gn22pdtdk1349q.apps.googleusercontent.com';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleOAuthSuccess = useCallback(async (token, provider) => {
    setLoading(true);
    try {
      // Store the token and redirect to dashboard
      localStorage.setItem('token', token);
      toast.success(`Successfully logged in with ${provider}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle OAuth callback with token
  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const error = searchParams.get('error');

    if (error === 'oauth_failed') {
      toast.error('OAuth login failed. Please try again.');
      return;
    }

    if (token && provider) {
      handleOAuthSuccess(token, provider);
    }
  }, [searchParams, handleOAuthSuccess]);

  const handleGoogleSuccess = useCallback(async (response) => {
    setLoading(true);
    try {
      // Send the ID token to your backend
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const result = await fetch(`${apiUrl}/auth/google/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: response.credential,
        }),
      });

      const data = await result.json();
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        toast.success('Successfully logged in with Google!');
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Initialize Google OAuth
  useEffect(() => {
    console.log('🔍 Initializing Google OAuth...');
    console.log('🔑 Client ID:', GOOGLE_CLIENT_ID);
    console.log('🌐 Current origin:', window.location.origin);
    console.log('🌐 Current href:', window.location.href);
    console.log('🌐 Current protocol:', window.location.protocol);
    console.log('🌐 Current hostname:', window.location.hostname);
    console.log('🌐 Current port:', window.location.port);
    
    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google OAuth script loaded');
      if (window.google && window.google.accounts) {
        console.log('🔧 Initializing Google accounts...');
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSuccess,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin',
            ux_mode: 'popup',
          });
          console.log('✅ Google OAuth initialized successfully');
        } catch (error) {
          console.error('❌ Error initializing Google OAuth:', error);
        }
      } else {
        console.error('❌ Google accounts not available');
      }
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Google OAuth script:', error);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [handleGoogleSuccess]);

  const handleGoogleLogin = () => {
    console.log('🔘 Google login button clicked');
    console.log('🌐 Window location:', window.location.origin);
    console.log('🔑 Client ID being used:', GOOGLE_CLIENT_ID);
    
    if (window.google && window.google.accounts) {
      console.log('✅ Google accounts available, calling prompt()');
      try {
        window.google.accounts.id.prompt();
        console.log('✅ Google prompt() called successfully');
      } catch (error) {
        console.error('❌ Error calling Google prompt():', error);
        toast.error('Google OAuth error. Please try again.');
      }
    } else {
      console.error('❌ Google accounts not available');
      toast.error('Google OAuth not loaded. Please refresh the page.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="/apple.png" 
                alt="Logo" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* OAuth Buttons Section - Google Only for now */}
        <div className="space-y-4">
          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full group relative flex items-center justify-center px-6 py-4 border-2 border-gray-200 rounded-xl shadow-sm bg-white text-gray-700 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
          >
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-800">Continue with Google</span>
          </button>
        </div>

        {/* Info Section */}
        <div className="text-center space-y-4">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">New to chucamo?</span> Just sign in with Google to create your account automatically!
            </p>
          </div>
          
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="font-medium text-blue-600 hover:text-blue-500 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="font-medium text-blue-600 hover:text-blue-500 underline">
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Redirecting to Google authentication...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 
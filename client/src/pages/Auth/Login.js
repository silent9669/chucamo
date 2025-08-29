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
      const apiUrl = process.env.REACT_APP_API_URL || 'https://chucamo-backup.up.railway.app/api';
      console.log('🌐 Sending to API:', apiUrl);
      console.log('🔑 ID Token length:', response.credential ? response.credential.length : 0);
      
      const result = await fetch(`${apiUrl}/auth/google/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: response.credential,
        }),
      });

      console.log('📡 API response status:', result.status);
      const data = await result.json();
      console.log('📡 API response data:', data);
      
      if (data.success) {
        localStorage.setItem('token', data.token);
        toast.success('Successfully logged in with Google!');
        navigate('/dashboard');
      } else {
        toast.error(data.message || 'Login failed');
        setLoading(false);
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
    
    // Add global callback function for Google Sign-In
    window.handleGoogleCredentialResponse = (response) => {
      console.log('🔄 Google sign-in response received');
      handleGoogleSuccess(response);
    };
    
    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google OAuth script loaded');
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

        {/* Google Sign-In Section */}
        <div className="space-y-4">
          {/* Google Sign-In Button */}
          <div id="google-signin-fallback" className="flex justify-center">
            <div id="g_id_onload"
                 data-client_id={GOOGLE_CLIENT_ID}
                 data-callback="handleGoogleCredentialResponse"
                 data-auto_prompt="false">
            </div>
            <div className="g_id_signin"
                 data-type="standard"
                 data-size="large"
                 data-theme="outline"
                 data-text="signin_with"
                 data-shape="rectangular"
                 data-logo_alignment="left">
            </div>
          </div>
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
              Signing in with Google...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 
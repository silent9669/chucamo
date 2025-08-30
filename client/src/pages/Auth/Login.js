import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Google OAuth Client ID - use environment variable or fallback
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '222187587627-bt14cg9demfolkdd08gn22pdtdk134e9q.apps.googleusercontent.com';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  // Handle Google OAuth success
  const handleGoogleSuccess = async (response) => {
    try {
      setIsGoogleLoading(true);
      setError('');
      
      console.log('🔐 Google OAuth response received:', response);
      console.log('🔑 Credential length:', response.credential ? response.credential.length : 0);
      console.log('🔑 Client ID from response:', response.clientId);
      
      // Send the ID token to your backend
      const result = await loginWithGoogle(response.credential);
      
      if (result.success) {
        console.log('✅ Google login successful, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.error('❌ Google login failed:', result.message);
        setError(result.message || 'Google login failed');
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      setError('Google login failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Initialize Google OAuth
  useEffect(() => {
    // Prevent duplicate initialization
    if (window.googleOAuthInitialized) {
      console.log('🔍 Google OAuth already initialized, skipping...');
      return;
    }
    
    console.log('🔍 Initializing Google OAuth...');
    console.log('🔑 Client ID:', GOOGLE_CLIENT_ID);
    console.log('🌐 Current origin:', window.location.origin);
    console.log('🔧 Environment:', process.env.NODE_ENV);
    
    // Check if script is already loaded
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      console.log('🔍 Google OAuth script already loaded, skipping...');
      if (window.google && window.google.accounts) {
        initializeGoogleOAuth();
      }
      return;
    }
    
    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google OAuth script loaded');
      clearTimeout(timeout);
      initializeGoogleOAuth();
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Google OAuth script:', error);
    };
    
    // Add timeout for script loading
    const timeout = setTimeout(() => {
      if (!window.google || !window.google.accounts) {
        console.warn('⚠️ Google OAuth script loading timeout');
      }
    }, 10000); // 10 second timeout
    
    document.head.appendChild(script);
    
    // Function to initialize Google OAuth
    const initializeGoogleOAuth = () => {
      if (window.googleOAuthInitialized) {
        console.log('🔍 Google OAuth already initialized in function, skipping...');
        return;
      }
      
      if (window.google && window.google.accounts) {
        console.log('🔧 Initializing Google accounts...');
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSuccess,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin',
            ux_mode: 'popup'
          });
          
          console.log('✅ Google OAuth initialized successfully');
          window.googleOAuthInitialized = true;
          
          // Render the Google button
          try {
            const container = document.getElementById('google-signin-button');
            container.innerHTML = '';
            
            window.google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              text: 'signin_with',
              shape: 'rectangular',
              width: 400,
              logo_alignment: 'left',
              type: 'standard'
            });
            
            console.log('✅ Google button rendered successfully');
          } catch (renderError) {
            console.warn('⚠️ Google button render failed, using custom button:', renderError);
            
            // Fallback: Create a custom button
            const container = document.getElementById('google-signin-button');
            container.innerHTML = '';
            
            const customButton = document.createElement('button');
            customButton.innerHTML = `
              <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            `;
            customButton.className = 'px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-center space-x-2 text-gray-700 font-medium w-full max-w-md';
            customButton.onclick = () => {
              console.log('🔍 Custom Google button clicked');
              try {
                window.google.accounts.id.prompt();
              } catch (error) {
                console.error('❌ OAuth prompt failed:', error);
              }
            };
            
            container.appendChild(customButton);
            console.log('✅ Custom Google button created');
          }
        } catch (error) {
          console.error('❌ Error initializing Google OAuth:', error);
        }
      } else {
        console.error('❌ Google accounts not available');
      }
    };

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      window.googleOAuthInitialized = false;
    };
  }, []);

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
          {/* Google Sign-In Button Container */}
          <div id="google-signin-button" className="flex justify-center"></div>
          
          {/* Loading State */}
          {isGoogleLoading && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Signing you in...</span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="text-center space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
            <p className="text-sm text-blue-700 font-medium">
              New to chucamo? Just sign in with Google to create account automatically!
            </p>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 
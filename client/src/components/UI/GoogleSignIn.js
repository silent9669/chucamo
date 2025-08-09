import React, { useEffect, useRef, useState } from 'react';
import logger from '../utils/logger';

const GoogleSignIn = ({ onSuccess, onError, className = '' }) => {
  const googleSignInRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    // Load Google Identity Services
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogleSignIn();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      script.onerror = () => {
        logger.error('Failed to load Google Identity Services');
        setInitError('Failed to load Google Identity Services');
        onError && onError('Failed to load Google Identity Services');
      };
      document.head.appendChild(script);
    };

    const initializeGoogleSignIn = () => {
      if (!window.google) {
        logger.error('Google Identity Services not loaded');
        setInitError('Google Identity Services not loaded');
        onError && onError('Google Identity Services not loaded');
        return;
      }

      // Get client ID from environment or meta tag
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 
                      document.querySelector('meta[name="google-signin-client_id"]')?.getAttribute('content');

      if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        logger.error('Google Client ID not configured');
        setInitError('Google Client ID not configured. Please set up your Google OAuth credentials.');
        onError && onError('Google Client ID not configured');
        return;
      }

      logger.debug('Initializing Google Sign-In with client ID:', clientId);

      try {
        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: onGoogleSignInSuccess,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Render the sign-in button
        if (googleSignInRef.current) {
          window.google.accounts.id.renderButton(googleSignInRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 240,
            height: 42
          });
        }

        logger.debug('Google Sign-In initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        logger.error('Google Sign-In initialization failed:', error);
        setInitError(`Google Sign-In initialization failed: ${error.message || 'Unknown error'}`);
        onError && onError(`Google Sign-In initialization failed: ${error.message || 'Unknown error'}`);
      }
    };

    const onGoogleSignInSuccess = (response) => {
      try {
        logger.debug('Google Sign-In successful, ID token received');
        
        const userData = {
          idToken: response.credential
        };

        onSuccess && onSuccess(userData);
      } catch (error) {
        logger.error('Error processing Google Sign-In:', error);
        onError && onError('Failed to process Google Sign-In');
      }
    };

    loadGoogleScript();

    // Cleanup function
    return () => {
      // Sign out when component unmounts
      if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
      }
    };
  }, [onSuccess, onError]);

  if (initError) {
    return (
      <div className={`${className} p-4 bg-red-50 border border-red-200 rounded-lg`}>
        <div className="text-center">
          <p className="text-red-600 text-sm font-medium">Google Sign-In Not Available</p>
          <p className="text-red-500 text-xs mt-1">{initError}</p>
          <p className="text-gray-500 text-xs mt-2">
            Please contact support or use the regular login form below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {!isInitialized && (
        <div className="flex justify-center items-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600 text-sm">Loading Google Sign-In...</span>
        </div>
      )}
      <div ref={googleSignInRef} className="flex justify-center"></div>
    </div>
  );
};

export default GoogleSignIn;

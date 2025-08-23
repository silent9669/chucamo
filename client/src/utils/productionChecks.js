// Production environment checks and validations
export const validateProductionEnvironment = () => {
  const issues = [];
  
  // Check for required environment variables
  if (!process.env.REACT_APP_API_URL && process.env.NODE_ENV === 'production') {
    issues.push('REACT_APP_API_URL is not set in production');
  }
  
  // Check for development-only code that might have been left in
  if (process.env.NODE_ENV === 'production') {
    // Check if there are any hardcoded localhost URLs
    if (window.location.hostname === 'localhost') {
      issues.push('Application is running on localhost in production mode');
    }
  }
  
  // Validate API configuration
  if (process.env.NODE_ENV === 'production') {
    const apiUrl = process.env.REACT_APP_API_URL;
    if (apiUrl && !apiUrl.startsWith('https://')) {
      issues.push('Production API URL should use HTTPS');
    }
  }
  
  return issues;
};

// Performance monitoring for production
export const initializePerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    // Add performance monitoring here (e.g., Google Analytics, Sentry, etc.)
    
    // Monitor for slow performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        if (loadTime > 5000) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Page load time is slow:', loadTime + 'ms');
          }
        }
      });
    }
    
    // Monitor for memory leaks
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
          if (process.env.NODE_ENV === 'development') {
            console.warn('High memory usage detected:', 
              Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB');
          }
        }
      }, 30000); // Check every 30 seconds
    }
  }
};

// Error reporting for production
export const reportError = (error, errorInfo = null) => {
  if (process.env.NODE_ENV === 'production') {
    // Send error to external service (e.g., Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    // For now, just log to console with a production-friendly message
    console.error('Production error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  } else {
    // In development, log everything
    console.error('Development error:', error, errorInfo);
  }
};

// Health check for production
export const performHealthCheck = async () => {
  if (process.env.NODE_ENV === 'production') {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Health check failed:', response.status);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Health check error:', error.message);
      }
    }
  }
};

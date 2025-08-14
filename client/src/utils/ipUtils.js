// IP and environment utilities for consistent functionality across different IP addresses

// Get the current IP address or hostname
export const getCurrentIP = () => {
  // In browser environment, we can't directly get the IP
  // But we can get the hostname and other network info
  return {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    href: window.location.href,
    origin: window.location.origin
  };
};

// Check if we're in a local development environment
export const isLocalEnvironment = () => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')
  );
};

// Check if we're in a production environment
export const isProductionEnvironment = () => {
  return process.env.NODE_ENV === 'production';
};

// Check if copy-paste should be enabled for this environment
export const shouldEnableCopyPaste = () => {
  // Always enable copy-paste functionality
  // The watermark will still work regardless of environment
  return true;
};

// Get environment-specific configuration
export const getEnvironmentConfig = () => {
  const isLocal = isLocalEnvironment();
  const isProd = isProductionEnvironment();
  
  return {
    isLocal,
    isProd,
    copyPasteEnabled: shouldEnableCopyPaste(),
    watermarkText: "ChuCaMo©",
    debugMode: !isProd
  };
};

// Log environment information for debugging
export const logEnvironmentInfo = () => {
  const config = getEnvironmentConfig();
  const ipInfo = getCurrentIP();
  
  console.log('Environment Configuration:', {
    ...config,
    ipInfo,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
};

// Check if the current environment has any restrictions
export const hasEnvironmentRestrictions = () => {
  // No restrictions based on IP or environment
  // Copy-paste functionality works everywhere
  return false;
};

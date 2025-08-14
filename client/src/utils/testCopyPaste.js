// Test utility for copy-paste functionality across different IP addresses

import { getEnvironmentConfig, logEnvironmentInfo } from './ipUtils';

// Test the copy-paste functionality
export const testCopyPaste = async () => {
  console.log('🧪 Testing Copy-Paste Functionality...');
  
  // Log environment information
  logEnvironmentInfo();
  
  const config = getEnvironmentConfig();
  
  // Test clipboard API availability
  const clipboardAvailable = navigator.clipboard && navigator.clipboard.writeText;
  console.log('📋 Clipboard API Available:', clipboardAvailable);
  
  // Test selection API
  const selectionAvailable = window.getSelection;
  console.log('👆 Selection API Available:', selectionAvailable);
  
  // Test if we can create a test selection
  try {
    // Create a test element
    const testElement = document.createElement('div');
    testElement.textContent = 'Test content for copy-paste';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.top = '-9999px';
    document.body.appendChild(testElement);
    
    // Create a selection
    const range = document.createRange();
    range.selectNodeContents(testElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    console.log('✅ Selection created successfully');
    
    // Test clipboard write if available
    if (clipboardAvailable) {
      try {
        await navigator.clipboard.writeText('Test clipboard write');
        console.log('✅ Clipboard write successful');
      } catch (error) {
        console.warn('⚠️ Clipboard write failed:', error.message);
      }
    }
    
    // Clean up
    selection.removeAllRanges();
    document.body.removeChild(testElement);
    
  } catch (error) {
    console.error('❌ Selection test failed:', error);
  }
  
  // Test environment-specific functionality
  console.log('🌍 Environment Test Results:', {
    isLocal: config.isLocal,
    isProduction: config.isProd,
    copyPasteEnabled: config.copyPasteEnabled,
    watermarkText: config.watermarkText,
    debugMode: config.debugMode
  });
  
  // Test IP/hostname detection
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  console.log('🏠 Network Info:', {
    hostname,
    protocol,
    fullUrl: window.location.href,
    origin: window.location.origin
  });
  
  return {
    success: true,
    clipboardAvailable,
    selectionAvailable,
    config,
    hostname,
    protocol
  };
};

// Test specific copy event handling
export const testCopyEvent = () => {
  console.log('📝 Testing Copy Event Handling...');
  
  try {
    // Create a test copy event
    const testEvent = new Event('copy', { 
      bubbles: true, 
      cancelable: true 
    });
    
    // Add test data
    Object.defineProperty(testEvent, 'clipboardData', {
      value: {
        setData: (type, data) => {
          console.log(`📋 Setting clipboard data: ${type} = ${data}`);
        },
        getData: (type) => {
          console.log(`📋 Getting clipboard data: ${type}`);
          return 'test data';
        }
      },
      writable: true
    });
    
    // Dispatch the event
    document.dispatchEvent(testEvent);
    console.log('✅ Copy event dispatched successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Copy event test failed:', error);
    return false;
  }
};

// Comprehensive test suite
export const runCopyPasteTestSuite = async () => {
  console.log('🚀 Starting Copy-Paste Test Suite...');
  console.log('=' .repeat(50));
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: getEnvironmentConfig(),
    tests: {}
  };
  
  // Test 1: Basic functionality
  try {
    results.tests.basic = await testCopyPaste();
  } catch (error) {
    results.tests.basic = { success: false, error: error.message };
  }
  
  // Test 2: Copy event handling
  try {
    results.tests.copyEvent = testCopyEvent();
  } catch (error) {
    results.tests.copyEvent = { success: false, error: error.message };
  }
  
  // Test 3: Browser compatibility
  results.tests.browser = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  };
  
  console.log('📊 Test Suite Results:', results);
  console.log('=' .repeat(50));
  
  return results;
};

// Export for use in components
export default {
  testCopyPaste,
  testCopyEvent,
  runCopyPasteTestSuite
};

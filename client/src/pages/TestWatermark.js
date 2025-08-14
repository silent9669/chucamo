import React from 'react';
import useCopyWatermark from "../hooks/useCopyWatermark";
import { getEnvironmentConfig, logEnvironmentInfo } from "../utils/ipUtils";
import { runCopyPasteTestSuite } from "../utils/testCopyPaste";

export default function TestWatermark() {
  // Apply copy watermark protection
  useCopyWatermark();
  
  // Log environment info for debugging
  React.useEffect(() => {
    logEnvironmentInfo();
  }, []);

  const config = getEnvironmentConfig();

  // Handle test button click
  const handleRunTests = async () => {
    console.log('🧪 Running copy-paste tests...');
    try {
      const results = await runCopyPasteTestSuite();
      console.log('✅ Tests completed successfully');
      // You can add a toast notification here if needed
    } catch (error) {
      console.error('❌ Tests failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Copy Watermark Test Page</h1>
        
        {/* Environment Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Environment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Environment:</strong> {config.isProd ? 'Production' : 'Development'}
            </div>
            <div>
              <strong>Copy-Paste Enabled:</strong> {config.copyPasteEnabled ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Watermark Text:</strong> {config.watermarkText}
            </div>
            <div>
              <strong>Debug Mode:</strong> {config.debugMode ? 'Yes' : 'No'}
            </div>
          </div>
          
          {/* Test Button */}
          <div className="mt-4">
            <button
              onClick={handleRunTests}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              🧪 Run Copy-Paste Tests
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Click to run comprehensive tests in the browser console
            </p>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-3">Test Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li>Select and copy any text from the protected content below</li>
            <li>Try pasting it somewhere else - you should see "{config.watermarkText}" instead</li>
            <li>This functionality should work consistently across all IP addresses</li>
            <li>Copy-paste adds "{config.watermarkText}" watermark automatically</li>
            <li>Open browser console (F12) to see detailed test results</li>
          </ul>
        </div>

        {/* Protected Content for Testing */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Protected Content (Try Copying This)</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded border">
              <h3 className="font-medium text-gray-800 mb-2">Sample Reading Passage</h3>
              <p className="text-gray-700 leading-relaxed">
                The quick brown fox jumps over the lazy dog. This is a sample text that demonstrates 
                the copy protection functionality. When you try to copy this content, it will be 
                automatically replaced with the watermark "{config.watermarkText}" to protect 
                intellectual property.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded border">
              <h3 className="font-medium text-gray-800 mb-2">Sample Question</h3>
              <p className="text-gray-700 leading-relaxed">
                What is the main idea of the passage above? This question tests your understanding 
                of the reading material. The copy protection ensures that test content cannot be 
                easily shared or distributed without proper attribution.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded border">
              <h3 className="font-medium text-gray-800 mb-2">Sample Answer Options</h3>
              <ul className="text-gray-700 space-y-1">
                <li>A) The fox is quick and brown</li>
                <li>B) The dog is lazy and sleepy</li>
                <li>C) The passage demonstrates copy protection</li>
                <li>D) All of the above</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Technical Details</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Hook:</strong> useCopyWatermark() - Protects all content when no selectors specified
            </p>
            <p>
              <strong>Protection:</strong> Covers copy events, right-click context menu, and keyboard shortcuts
            </p>
            <p>
              <strong>Compatibility:</strong> Works across different browsers and IP addresses
            </p>
            <p>
              <strong>Fallback:</strong> Multiple clipboard methods ensure consistent functionality
            </p>
            <p>
              <strong>Testing:</strong> Use the test button above to run comprehensive diagnostics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

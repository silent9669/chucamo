import React, { useState, useEffect } from 'react';
import { FiShield, FiDatabase, FiLock, FiCheckCircle, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import storageMigration from '../../utils/storageMigration';
import secureStorage from '../../utils/secureStorage';
import logger from '../../utils/logger';

const PrivacyMigration = ({ onComplete, show = true }) => {
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (show) {
      checkMigrationStatus();
    }
  }, [show]);

  const checkMigrationStatus = () => {
    const status = storageMigration.getMigrationStatus();
    setMigrationStatus(status);
  };

  const handleMigration = async () => {
    if (isMigrating) return;

    try {
      setIsMigrating(true);
      setMigrationProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setMigrationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await storageMigration.performMigration();
      
      clearInterval(progressInterval);
      setMigrationProgress(100);

      if (result.success) {
        logger.info('Privacy migration completed successfully:', result);
        
        // Update status
        checkMigrationStatus();
        
        // Notify parent component
        if (onComplete) {
          onComplete(result);
        }

        // Auto-hide after success
        setTimeout(() => {
          setShowDetails(false);
        }, 3000);
      } else {
        logger.error('Privacy migration failed:', result);
      }
    } catch (error) {
      logger.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
      setMigrationProgress(0);
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('This will permanently remove all test data from your browser storage. This action cannot be undone. Are you sure?')) {
      return;
    }

    try {
      const result = storageMigration.cleanupLocalStorage();
      if (result.success) {
        checkMigrationStatus();
        logger.info('LocalStorage cleanup completed:', result);
      }
    } catch (error) {
      logger.error('Cleanup error:', error);
    }
  };

  if (!show || !migrationStatus?.needsMigration) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <FiShield className="text-2xl" />
            <div>
              <h2 className="text-xl font-bold">🔒 Privacy & Security Update</h2>
              <p className="text-blue-100 mt-1">
                We're upgrading your data security to protect your test results
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Privacy Issues */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FiAlertTriangle className="text-orange-500 mr-2" />
              Current Privacy Concerns
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <FiAlertTriangle className="text-orange-500 mt-1 flex-shrink-0" />
                <span>Your test results are currently stored in browser storage (localStorage)</span>
              </div>
              <div className="flex items-start space-x-2">
                <FiAlertTriangle className="text-orange-500 mt-1 flex-shrink-0" />
                <span>This data persists even after logout and can be accessed by anyone using your device</span>
              </div>
              <div className="flex items-start space-x-2">
                <FiAlertTriangle className="text-orange-500 mt-1 flex-shrink-0" />
                <span>Browser extensions and other websites can potentially access this sensitive information</span>
              </div>
            </div>
          </div>

          {/* Security Improvements */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FiShield className="text-green-500 mr-2" />
              New Security Features
            </h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <FiDatabase className="text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-green-800">Server-Side Storage</div>
                  <div className="text-sm text-green-600">Test results stored securely on our servers with encryption</div>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <FiLock className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-blue-800">Session-Based Encryption</div>
                  <div className="text-sm text-blue-600">Temporary data encrypted and cleared when you close the browser</div>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <FiCheckCircle className="text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium text-purple-800">Automatic Cleanup</div>
                  <div className="text-sm text-purple-600">Sensitive data automatically removed after 24 hours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Migration Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FiInfo className="text-blue-500 mr-2" />
              Migration Status
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Data to migrate:</span>
                  <span className="ml-2 text-gray-800">{migrationStatus.localStorageKeys} items</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Secure storage:</span>
                  <span className="ml-2 text-gray-800">{migrationStatus.secureStorageKeys} items</span>
                </div>
              </div>
              
              {migrationProgress > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Migration Progress</span>
                    <span>{migrationProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${migrationProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleMigration}
              disabled={isMigrating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isMigrating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Migrating...</span>
                </>
              ) : (
                <>
                  <FiShield className="text-lg" />
                  <span>Start Secure Migration</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors duration-200"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {/* Details Section */}
          {showDetails && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3">What happens during migration?</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>1. Your test completion data is securely transferred to our servers</div>
                <div>2. Progress data is encrypted and stored in secure session storage</div>
                <div>3. Old localStorage data is safely removed</div>
                <div>4. All your test results remain accessible through the Results page</div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCleanup}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Force cleanup localStorage (use only if migration fails)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>🔒 Your privacy is our priority</span>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyMigration;

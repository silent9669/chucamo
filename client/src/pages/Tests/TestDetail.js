import React, { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiPlay, FiClock, FiList } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { testsAPI } from '../../services/api';
import logger from '../../utils/logger';
import useCopyWatermark from '../../hooks/useCopyWatermark';

const TestDetail = () => {
  const navigate = useNavigate();
  const { id: testId } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Apply copy watermark protection to all test content areas
  useCopyWatermark([
    '.test-description',     // Test description
    '.test-instructions',    // Test instructions
    '.test-sections',        // Test sections info
    '.test-header',          // Test header info
    '.test-content',         // All test content wrapper
    '.test-overview',        // Test overview section
    '.test-details'          // Test details section
  ]);

  const loadTestData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await testsAPI.getById(testId);
      const testData = response.data.test;
      setTest(testData);
    } catch (error) {
      logger.error('Error loading test:', error);
      setError('Failed to load test data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTestData();
  }, [loadTestData]);

  const handleStartTest = async () => {
    try {
      // Check if user can start the test (check max attempts)
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          testId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message === 'Upgrade to student account to re-do test') {
            alert('⚠️ Upgrade to student account to re-do test');
            return;
          } else if (errorData.message === 'Maximum attempts reached for this test') {
            alert('⚠️ Maximum attempts reached for this test');
            return;
          }
        } catch (e) {
          logger.error('Error parsing error response:', e);
        }
        
        alert('Failed to start test. Please try again.');
        return;
      }

      // If successful, store the result ID and navigate to the test
      const result = await response.json();
      localStorage.setItem(`test_result_${testId}`, result.result._id);
      navigate(`/tests/${testId}/take`);
    } catch (error) {
      logger.error('Error starting test:', error);
      alert('Failed to start test. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading test details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadTestData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-600">Test not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 test-content">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 test-header">
          <div className="flex items-center mb-4">
            <FiFileText className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <FiClock className="w-4 h-4 mr-2" />
              <span>Duration: {formatDuration(test.totalTime)}</span>
            </div>
            <div className="flex items-center">
              <FiList className="w-4 h-4 mr-2" />
              <span>Questions: {test.totalQuestions}</span>
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${test.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span>Status: {test.isActive ? 'Available' : 'Unavailable'}</span>
            </div>
          </div>
        </div>

        {/* Test Details Section - Middle Content */}
        <div className="test-details">
          {/* Test Description */}
          {test.description && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 test-description">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600">{test.description}</p>
            </div>
          )}

          {/* Test Sections */}
          {test.sections && test.sections.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 test-sections">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Sections</h2>
              <div className="space-y-3">
                {test.sections.map((section, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Section {index + 1}: {section.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {section.type === 'english' ? 'Reading and Writing' : 'Math'} • {section.questionCount} questions
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDuration(section.timeLimit)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 test-instructions">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">1</span>
                <p>Read each passage carefully before answering the questions.</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">2</span>
                <p>Select the best answer for each question. You can change your answer before submitting.</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">3</span>
                <p>Use the "Mark for Review" feature to flag questions you want to revisit later.</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">4</span>
                <p>Monitor your time using the timer in the top center of the screen.</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded mr-3 mt-0.5">5</span>
                <p>You can save your progress and return later using the "Save & Exit" button.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Start Test Button */}
        <div className="text-center test-overview">
          <button
            onClick={handleStartTest}
            disabled={!test.isActive}
            className={`inline-flex items-center px-8 py-4 font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl ${
              test.isActive 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            <FiPlay className="w-5 h-5 mr-2" />
            {test.isActive ? 'Start Test' : 'Test Unavailable'}
          </button>
          <p className="text-sm text-gray-500 mt-3">
            {test.isActive 
              ? 'Click to begin the test. Make sure you have a quiet environment and are ready to focus.'
              : 'This test is currently unavailable.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestDetail; 
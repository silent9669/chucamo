import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiFileText, FiCheckCircle, FiXCircle, FiClock, FiEye } from 'react-icons/fi';
import { resultsAPI } from '../../services/api';

const ResultDetail = () => {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        setLoading(true);
        const response = await resultsAPI.getById(id);
        setResult(response.data.result);
      } catch (err) {
        setError('Failed to load result details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadResult();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Error: {error}</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Result not found</div>
      </div>
    );
  }

  // Only show detailed view for completed tests
  if (result.status !== 'completed') {
  return (
    <div className="text-center py-12">
        <FiClock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Not Completed</h2>
      <p className="text-gray-600 mb-6">
          This test is not completed yet. Complete the test to see detailed results.
      </p>
      <p className="text-sm text-gray-500">
          Current status: {result.status}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Results</h1>
          <p className="text-gray-600">Detailed review of your completed test</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Test Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{result.comprehensiveQuestions?.totalQuestions || 0}</div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{result.comprehensiveQuestions?.answeredQuestions || 0}</div>
            <div className="text-sm text-gray-600">Answered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{result.comprehensiveQuestions?.unansweredQuestions || 0}</div>
            <div className="text-sm text-gray-600">Unanswered</div>
          </div>
        </div>
      </div>

      {/* Questions Display */}
      <div className="space-y-6">
        {result.questionResults?.map((questionResult, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Question {index + 1}
              </h3>
              <div className="flex items-center space-x-2">
                {questionResult.isUnanswered ? (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium flex items-center">
                    <FiClock className="w-4 h-4 mr-1" />
                    Unanswered
                  </span>
                ) : questionResult.isCorrect ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
                    <FiCheckCircle className="w-4 h-4 mr-1" />
                    Correct
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center">
                    <FiXCircle className="w-4 h-4 mr-1" />
                    Incorrect
                  </span>
                )}
              </div>
            </div>

            {/* Question Content */}
            <div className="mb-4">
              <p className="text-gray-900">{questionResult.question?.content}</p>
            </div>

            {/* Options */}
            {questionResult.question?.options && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Options:</h4>
                <div className="space-y-2">
                  {questionResult.question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        {String.fromCharCode(65 + optIndex)}.
                      </span>
                      <span className={`text-sm ${
                        option.isCorrect ? 'text-green-600 font-semibold' : 'text-gray-700'
                      }`}>
                        {option.content}
                        {option.isCorrect && ' ✓'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Answer (if answered) */}
            {!questionResult.isUnanswered && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Your Answer:</h4>
                <p className={`text-sm ${
                  questionResult.isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {questionResult.userAnswer}
                </p>
              </div>
            )}

            {/* Correct Answer */}
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Correct Answer:</h4>
              <p className="text-green-700 font-semibold">
                {questionResult.correctAnswer || questionResult.question?.correctAnswer || 'Not available'}
              </p>
            </div>

            {/* Explanation */}
            {(questionResult.explanation || questionResult.question?.explanation) && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Explanation:</h4>
                <p className="text-blue-700 text-sm">
                  {questionResult.explanation || questionResult.question?.explanation}
                </p>
              </div>
            )}

            {/* Topic */}
            {questionResult.question?.topic && (
              <div className="mt-3">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  Topic: {questionResult.question.topic}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultDetail; 
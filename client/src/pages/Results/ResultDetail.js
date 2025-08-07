import React from 'react';
import { FiFileText } from 'react-icons/fi';

const ResultDetail = () => {
  return (
    <div className="text-center py-12">
      <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Result Details</h2>
      <p className="text-gray-600 mb-6">
        Review detailed results from a specific test attempt.
      </p>
      <p className="text-sm text-gray-500">
        This page will show question-by-question results, explanations, and review options.
      </p>
    </div>
  );
};

export default ResultDetail; 
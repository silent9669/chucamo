import React, { useState } from 'react';
import { FiInfo, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import KaTeXDisplay from './KaTeXDisplay';

const WrittenAnswerInput = ({ 
  value, 
  onChange, 
  placeholder = "Enter your answer here...",
  acceptableAnswers = [],
  showNotes = true,
  isTestMode = false // New prop to control test mode styling
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const getAnswerStatus = () => {
    if (!value.trim()) return 'empty';
    if (acceptableAnswers.length === 0) return 'no-answers';
    
    const normalizedValue = value.trim().toLowerCase();
    const isCorrect = acceptableAnswers.some(answer => 
      answer.trim().toLowerCase() === normalizedValue
    );
    
    return isCorrect ? 'correct' : 'incorrect';
  };

  const answerStatus = getAnswerStatus();

  return (
    <div className="space-y-4">
      {/* Answer Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Your Answer
        </label>
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => {
              // Limit to 6 characters
              const newValue = e.target.value.slice(0, 6);
              onChange(newValue);
            }}
            placeholder={placeholder}
            maxLength={6}
            className={`w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 ${
              !isTestMode && answerStatus === 'correct' 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 bg-white'
            }`}
            rows={2}
          />
          {/* Character counter */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {value.length}/6
          </div>
          
          {/* Status Indicator - only show check mark for correct answers when not in test mode */}
          {!isTestMode && answerStatus === 'correct' && (
            <div className="absolute top-3 right-3 text-green-600">
              <FiCheckCircle size={20} />
            </div>
          )}
        </div>
      </div>

      {/* Acceptable Answers Preview - exactly like the first image */}
      {showHelp && acceptableAnswers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
            <div className="text-sm text-blue-800 w-full">
              <p className="font-medium mb-3">Examples of Acceptable Answer Formats:</p>
              
              {/* Static table format exactly like the user's image */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border border-blue-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-blue-300 px-3 py-2 text-left font-medium">Answer</th>
                      <th className="border border-blue-300 px-3 py-2 text-left font-medium">Acceptable way to enter answer</th>
                      <th className="border border-blue-300 px-3 py-2 text-left font-medium">Unacceptable: will NOT receive credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="border border-blue-300 px-3 py-2 font-medium">3.5</td>
                      <td className="border border-blue-300 px-3 py-2">
                        <div className="space-y-1">
                          <div className="text-green-700">• 3.5</div>
                          <div className="text-green-700">• 3.50</div>
                          <div className="text-green-700">• 7/2</div>
                        </div>
                      </td>
                      <td className="border border-blue-300 px-3 py-2">
                        <div className="space-y-1">
                          <div className="text-red-700">• 31/2</div>
                          <div className="text-red-700">• 3 1/2</div>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-blue-300 px-3 py-2 font-medium">
                        <KaTeXDisplay content="$$\frac{2}{3}$$" />
                      </td>
                      <td className="border border-blue-300 px-3 py-2">
                        <div className="space-y-1">
                          <div className="text-green-700">• 2/3</div>
                          <div className="text-green-700">• .6666</div>
                          <div className="text-green-700">• .6667</div>
                          <div className="text-green-700">• 0.666</div>
                          <div className="text-green-700">• 0.667</div>
                        </div>
                      </td>
                      <td className="border border-blue-300 px-3 py-2">
                        <div className="space-y-1">
                          <div className="text-red-700">• 0.66</div>
                          <div className="text-red-700">• .66</div>
                          <div className="text-red-700">• 0.67</div>
                          <div className="text-red-700">• .67</div>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="border border-blue-300 px-3 py-2 font-medium">
                        <KaTeXDisplay content="-$$\frac{1}{3}$$" />
                      </td>
                      <td className="border border-blue-300 px-3 py-2">
                        <div className="space-y-1">
                          <div className="text-green-700">• -1/3</div>
                          <div className="text-green-700">• -.3333</div>
                          <div className="text-green-700">• -0.333</div>
                        </div>
                      </td>
                      <td className="border border-blue-300 px-3 py-2">
                        <div className="space-y-1">
                          <div className="text-red-700">• -.33</div>
                          <div className="text-red-700">• -0.33</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Toggle */}
      {acceptableAnswers.length > 0 && (
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          {showHelp ? 'Hide' : 'Show'} acceptable answer formats
        </button>
      )}
    </div>
  );
};

export default WrittenAnswerInput; 
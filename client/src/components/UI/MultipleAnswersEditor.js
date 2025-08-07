import React from 'react';
import { FiPlus, FiX } from 'react-icons/fi';
import KaTeXEditor from './KaTeXEditor';

const MultipleAnswersEditor = ({ 
  primaryAnswer, 
  onPrimaryAnswerChange, 
  acceptableAnswers = [''], 
  onAcceptableAnswersChange,
  placeholder = "Enter the primary correct answer...",
  label = "Primary Correct Answer"
}) => {
  const addAlternativeAnswer = () => {
    const newAnswers = [...acceptableAnswers, ''];
    onAcceptableAnswersChange(newAnswers);
  };

  const removeAlternativeAnswer = (index) => {
    const newAnswers = acceptableAnswers.filter((_, i) => i !== index);
    onAcceptableAnswersChange(newAnswers);
  };

  const updateAlternativeAnswer = (index, value) => {
    const newAnswers = [...acceptableAnswers];
    newAnswers[index] = value;
    onAcceptableAnswersChange(newAnswers);
  };

  return (
    <div className="space-y-4">
      <div>
        <KaTeXEditor
          value={primaryAnswer}
          onChange={onPrimaryAnswerChange}
          placeholder={placeholder}
          rows={2}
          label={label}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Acceptable Alternative Answers (Optional)
        </label>
        <div className="space-y-2">
          {acceptableAnswers.map((answer, index) => (
            <div key={`alternative-answer-${index}-${answer}`} className="flex items-center gap-2">
              <div className="flex-1">
                <KaTeXEditor
                  value={answer}
                  onChange={(value) => updateAlternativeAnswer(index, value)}
                  placeholder={`Alternative answer ${index + 1}...`}
                  rows={1}
                />
              </div>
              {acceptableAnswers.length > 1 && (
                <button
                  onClick={() => removeAlternativeAnswer(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                  title="Remove alternative answer"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addAlternativeAnswer}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <FiPlus size={14} />
            Add Alternative Answer
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultipleAnswersEditor; 
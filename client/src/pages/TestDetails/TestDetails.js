import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import KaTeXDisplay from '../../components/UI/KaTeXDisplay';
import { testsAPI } from '../../services/api';
import logger from '../../utils/logger';

const TestDetails = () => {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  
  const [test, setTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showAnswers, setShowAnswers] = useState(true);
  const [showExplanations, setShowExplanations] = useState(false);

  const getCurrentSectionData = useCallback(() => {
    if (!test || !test.sections) return null;
    return test.sections[currentSection] || null;
  }, [test, currentSection]);

  const getCurrentSectionQuestions = useCallback(() => {
    const section = getCurrentSectionData();
    if (!section || !section.questions) return [];
    return section.questions;
  }, [getCurrentSectionData]);

  const getCurrentQuestionData = useCallback(() => {
    const questions = getCurrentSectionQuestions();
    if (questions.length === 0) return null;
    return questions[currentQuestion - 1] || null;
  }, [currentQuestion, getCurrentSectionQuestions]);

  const getQuestionResult = useCallback((questionId) => {
    if (!testResults || !testResults.answers) return null;
    
    // Try multiple formats for question ID
    let result = testResults.answers[questionId];
    if (result) {
      return result;
    }
    
    // If still not found, try with section-question format
    if (questionId.includes('-')) {
      const [sectionIndex, questionIndex] = questionId.split('-').map(Number);
      const question = test?.sections?.[sectionIndex]?.questions?.[questionIndex - 1];
      if (question && question.id) {
        const questionDbId = question.id.toString();
        result = testResults.answers[questionDbId];
        if (result) {
          return result;
        }
      }
    }
    
    return null;
  }, [testResults, test]);

  const isAnswerCorrect = useCallback((questionId, selectedAnswer) => {
    // Parse the questionId to get section and question indices
    const [sectionIndex, questionIndex] = questionId.split('-').map(Number);
    
    const question = test?.sections?.[sectionIndex]?.questions?.[questionIndex - 1];
    
    if (!question) {
      return false;
    }
    
    // For multiple choice questions
    if (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') {
      // Method 1: Check if the selected answer matches an option with isCorrect flag
      if (question.options) {
        const selectedOption = question.options.find(opt => opt.content === selectedAnswer);
        if (selectedOption && selectedOption.isCorrect === true) {
          return true;
        }
      }
      
      // Method 2: Check if the selected answer matches the correctAnswer field
      if (typeof question.correctAnswer === 'string') {
        return selectedAnswer === question.correctAnswer;
      } else if (typeof question.correctAnswer === 'number' && question.options) {
        // If correctAnswer is an index, get the content from options
        const correctOption = question.options[question.correctAnswer];
        const correctContent = correctOption?.content || correctOption;
        return selectedAnswer === correctContent;
      } else if (typeof question.correctAnswer === 'number') {
        // Handle case where correctAnswer is just a number (index)
        return selectedAnswer === question.correctAnswer.toString();
      }
      
      // Method 3: Check if the selected answer matches any option marked as correct
      if (question.options) {
        const correctOption = question.options.find(opt => opt.isCorrect === true);
        if (correctOption && correctOption.content === selectedAnswer) {
          return true;
        }
      }
    } else if (question.answerType === 'written' || question.type === 'grid-in') {
      const acceptableAnswers = question.acceptableAnswers || [];
      const writtenAnswer = question.writtenAnswer || '';
      
      // Add writtenAnswer to acceptable answers if it's not already there
      const allAcceptableAnswers = [...acceptableAnswers];
      if (writtenAnswer && !acceptableAnswers.includes(writtenAnswer)) {
        allAcceptableAnswers.push(writtenAnswer);
      }
      
      return allAcceptableAnswers.some(answer => 
        selectedAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
      );
    }
    
    return false;
  }, [test]);

  const getAnswerStatus = useCallback((questionId, optionContent) => {
    const questionResult = getQuestionResult(questionId);
    
    // Parse the questionId to get section and question indices
    const [sectionIndex, questionIndex] = questionId.split('-').map(Number);
    const question = test?.sections?.[sectionIndex]?.questions?.[questionIndex - 1];
    
    if (!question) return 'unanswered';
    
    // Determine if this option is the correct answer
    let isCorrectAnswer = false;
    if (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') {
      // Method 1: Check if this option has isCorrect flag
      if (question.options) {
        const option = question.options.find(opt => opt.content === optionContent);
        if (option && option.isCorrect === true) {
          isCorrectAnswer = true;
        }
      }
      
      // Method 2: Check if this option matches the correctAnswer field
      if (!isCorrectAnswer) {
        if (typeof question.correctAnswer === 'string') {
          isCorrectAnswer = optionContent === question.correctAnswer;
        } else if (typeof question.correctAnswer === 'number' && question.options) {
          const correctOption = question.options[question.correctAnswer];
          const correctContent = correctOption?.content || correctOption;
          isCorrectAnswer = optionContent === correctContent;
        } else if (typeof question.correctAnswer === 'number') {
          isCorrectAnswer = optionContent === question.correctAnswer.toString();
        }
      }
      
      // Method 3: Check if this option matches any option marked as correct
      if (!isCorrectAnswer && question.options) {
        const correctOption = question.options.find(opt => opt.isCorrect === true);
        if (correctOption && correctOption.content === optionContent) {
          isCorrectAnswer = true;
        }
      }
    }
    
    if (!questionResult) return 'unanswered';
    
    const userSelected = questionResult.selectedAnswer === optionContent;
    const isCorrect = isAnswerCorrect(questionId, questionResult.selectedAnswer);
    
    if (userSelected && isCorrect) return 'correct';
    if (userSelected && !isCorrect) return 'incorrect';
    if (isCorrectAnswer && !userSelected) return 'correct-answer';
    return 'unanswered';
  }, [getQuestionResult, test, isAnswerCorrect]);

  const getQuestionBoxColor = useCallback((questionId) => {
    if (!testResults) return '';
    
    const questionResult = getQuestionResult(questionId);
    if (!questionResult) return 'border-l-4 border-red-500';
    
    const isCorrect = isAnswerCorrect(questionId, questionResult.selectedAnswer);
    return isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500';
  }, [testResults, getQuestionResult, isAnswerCorrect]);

  const handleQuestionChange = (questionNum) => {
    setCurrentQuestion(questionNum);
  };

  const handleSectionChange = (sectionIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentQuestion(1);
  };

  const loadTestDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load test data from API
      const testResponse = await testsAPI.getById(testId);
      const testData = testResponse.data.test;
      setTest(testData);

      // Load test results from localStorage
      const completionData = localStorage.getItem(`test_completion_${testId}`);
      
      if (completionData) {
        const parsedData = JSON.parse(completionData);
        
        // Validate completion data structure
        if (!parsedData || !Array.isArray(parsedData.answeredQuestions)) {
          logger.warn('Invalid completion data structure for test:', testId);
          setTestResults(null);
          return;
        }
        
        // Convert answeredQuestions array to answers object for scoring
        const answers = {};
        parsedData.answeredQuestions.forEach(([questionKey, answer]) => {
          try {
            // Handle different questionKey formats
            let questionId;
            
            if (typeof questionKey === 'string' && questionKey.includes('-')) {
              // Format: "section-question" (e.g., "0-1")
              const [sectionIndex, questionNum] = questionKey.split('-').map(Number);
              questionId = `${sectionIndex}-${questionNum}`;
            } else if (typeof questionKey === 'number' || typeof questionKey === 'string') {
              // Format: numeric ID (e.g., 1754466772119) - this is the question ID from the database
              // We need to map this to the section-question format for the review page
              questionId = questionKey.toString();
            } else {
              // Fallback for unknown formats
              logger.warn('Unknown questionKey format:', questionKey);
              questionId = questionKey?.toString() || 'unknown';
            }
            
            answers[questionId] = { selectedAnswer: answer };
          } catch (error) {
            logger.warn('Error processing questionKey:', questionKey, error);
            const questionId = questionKey?.toString() || 'unknown';
            answers[questionId] = { selectedAnswer: answer };
          }
        });
        
        // Create a mapping from question IDs to section-question format for better lookup
        const questionIdToSectionMap = {};
        testData.sections?.forEach((section, sectionIndex) => {
          section.questions?.forEach((question, questionIndex) => {
            if (question.id) {
              questionIdToSectionMap[question.id.toString()] = `${sectionIndex}-${questionIndex + 1}`;
            }
          });
        });
        
        // Calculate overall test score and metrics directly here
        let totalQuestions = 0;
        let correctAnswers = 0;
        let correctCount = 0;
        let incorrectCount = 0;
        
        testData.sections?.forEach((section, sectionIndex) => {
          section.questions?.forEach((question, questionIndex) => {
            totalQuestions++;
            const questionId = `${sectionIndex}-${questionIndex + 1}`;
            const questionResult = answers[questionId];
            
            if (questionResult) {
              // Check if answer is correct using the same logic as isAnswerCorrect
              let isCorrect = false;
              
              if (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') {
                // Method 1: Check if the selected answer matches an option with isCorrect flag
                if (question.options) {
                  const selectedOption = question.options.find(opt => opt.content === questionResult.selectedAnswer);
                  if (selectedOption && selectedOption.isCorrect === true) {
                    isCorrect = true;
                  }
                }
                
                // Method 2: Check if the selected answer matches the correctAnswer field
                if (!isCorrect) {
                  if (typeof question.correctAnswer === 'string') {
                    isCorrect = questionResult.selectedAnswer === question.correctAnswer;
                  } else if (typeof question.correctAnswer === 'number' && question.options) {
                    const correctOption = question.options[question.correctAnswer];
                    const correctContent = correctOption?.content || correctOption;
                    isCorrect = questionResult.selectedAnswer === correctContent;
                  } else if (typeof question.correctAnswer === 'number') {
                    isCorrect = questionResult.selectedAnswer === question.correctAnswer.toString();
                  }
                }
                
                // Method 3: Check if the selected answer matches any option marked as correct
                if (!isCorrect && question.options) {
                  const correctOption = question.options.find(opt => opt.isCorrect === true);
                  if (correctOption && correctOption.content === questionResult.selectedAnswer) {
                    isCorrect = true;
                  }
                }
              } else if (question.answerType === 'written' || question.type === 'grid-in') {
                const acceptableAnswers = question.acceptableAnswers || [];
                const writtenAnswer = question.writtenAnswer || '';
                
                // Add writtenAnswer to acceptable answers if it's not already there
                const allAcceptableAnswers = [...acceptableAnswers];
                if (writtenAnswer && !acceptableAnswers.includes(writtenAnswer)) {
                  allAcceptableAnswers.push(writtenAnswer);
                }
                
                isCorrect = allAcceptableAnswers.some(answer => 
                  questionResult.selectedAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
                );
              }
              
              if (isCorrect) {
                correctAnswers++;
                correctCount++;
              } else {
                incorrectCount++;
              }
            } else {
              // Unanswered questions count as incorrect
              incorrectCount++;
            }
          });
        });
        
        const overallScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        
        setTestResults({
          answers,
          score: overallScore,
          correctCount,
          incorrectCount,
          totalQuestions: correctCount + incorrectCount,
          completedAt: parsedData.completedAt || new Date().toISOString(),
          timeSpent: parsedData.timeSpent || 0
        });
      } else {
        setTestResults(null);
      }
    } catch (error) {
      logger.error('Error loading test details:', error);
      setError('Failed to load test details');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  // Load test details when testId changes
  useEffect(() => {
    loadTestDetails();
  }, [testId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiX className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error || 'Test not found'}</p>
          <button
            onClick={() => navigate('/results')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const currentQuestionData = getCurrentQuestionData();
  const questions = getCurrentSectionQuestions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/results')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <FiArrowLeft className="h-5 w-5 mr-2" />
                Back to Results
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                {test.title || test.testName} - Test Review
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {showAnswers ? <FiEyeOff className="h-4 w-4 mr-1" /> : <FiEye className="h-4 w-4 mr-1" />}
                {showAnswers ? 'Hide' : 'Show'} Answers
              </button>
              
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                {showExplanations ? <FiEyeOff className="h-4 w-4 mr-1" /> : <FiEye className="h-4 w-4 mr-1" />}
                {showExplanations ? 'Hide' : 'Show'} Explanations
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results Summary */}
      {testResults && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {testResults.score || 0}%
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.correctCount || 0}
                </div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.incorrectCount || 0}
                </div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {testResults.totalQuestions || 0}
                </div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Section Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sections</h3>
              <div className="space-y-2">
                {test.sections?.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => handleSectionChange(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentSection === index
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{section.name || section.title}</div>
                    <div className="text-sm text-gray-500">
                      {section.questions?.length || 0} questions
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question Content and Navigation */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Question Content */}
              <div className="xl:col-span-3">
                {currentQuestionData ? (
                  <div className={`bg-white rounded-lg shadow p-6 ${getQuestionBoxColor(`${currentSection}-${currentQuestion}`)}`}>
                    {/* Question Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-500">
                          Section {currentSection + 1}, Question {currentQuestion}
                        </span>
                        {testResults && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            getQuestionResult(`${currentSection}-${currentQuestion}`) ? 
                              (isAnswerCorrect(`${currentSection}-${currentQuestion}`, getQuestionResult(`${currentSection}-${currentQuestion}`).selectedAnswer)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800')
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {getQuestionResult(`${currentSection}-${currentQuestion}`) ? 
                              (isAnswerCorrect(`${currentSection}-${currentQuestion}`, getQuestionResult(`${currentSection}-${currentQuestion}`).selectedAnswer) ? (
                                <>
                                  <FiCheck className="h-3 w-3 mr-1" />
                                  Correct
                                </>
                              ) : (
                                <>
                                  <FiX className="h-3 w-3 mr-1" />
                                  Incorrect
                                </>
                              )) : (
                                <>
                                  <FiX className="h-3 w-3 mr-1" />
                                  Unanswered
                                </>
                              )
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Reading Passage */}
                    {currentQuestionData.passage && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Reading Passage</h4>
                        <div className="text-gray-700 leading-relaxed">
                          <KaTeXDisplay content={currentQuestionData.passage} fontFamily="serif" />
                        </div>
                      </div>
                    )}

                    {/* Images */}
                    {currentQuestionData.images && currentQuestionData.images.length > 0 && (
                      <div className="mb-6">
                        <div className="space-y-4">
                          {currentQuestionData.images.map((image, index) => (
                            <div key={index} className="flex justify-center">
                              <img 
                                src={image.url} 
                                alt={`Question ${index + 1}`}
                                className="max-w-full h-auto rounded-lg shadow-md"
                                style={{ maxHeight: '400px' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                                         {/* Question */}
                     <div className="mb-6">
                       <h4 className="font-medium text-gray-900 mb-3">Question</h4>
                       <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'serif' }}>
                         <KaTeXDisplay content={currentQuestionData.question || currentQuestionData.content} fontFamily="serif" />
                       </div>
                     </div>

                    {/* Answer Options */}
                    {currentQuestionData.options && currentQuestionData.options.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">Answer Options</h4>
                        <div className="space-y-3">
                          {currentQuestionData.options.map((option, index) => {
                            const questionId = `${currentSection}-${currentQuestion}`;
                            const status = getAnswerStatus(questionId, option.content);
                            const statusClasses = {
                              'correct': 'bg-green-100 border-green-400 text-green-900 shadow-sm',
                              'incorrect': 'bg-red-100 border-red-400 text-red-900 shadow-sm',
                              'correct-answer': 'bg-green-50 border-green-300 text-green-800 shadow-sm',
                              'unanswered': 'bg-gray-50 border-gray-200 text-gray-700'
                            };
                            
                            return (
                              <div
                                key={index}
                                className={`p-4 border-2 rounded-lg transition-colors ${
                                  showAnswers ? statusClasses[status] : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                                    status === 'correct' ? 'border-green-500 bg-green-100' :
                                    status === 'incorrect' ? 'border-red-500 bg-red-100' :
                                    status === 'correct-answer' ? 'border-green-400 bg-green-50' :
                                    'border-gray-300 bg-gray-100'
                                  }`}>
                                    <span className={`text-sm font-medium ${
                                      status === 'correct' ? 'text-green-700' :
                                      status === 'incorrect' ? 'text-red-700' :
                                      status === 'correct-answer' ? 'text-green-600' :
                                      'text-gray-600'
                                    }`}>
                                      {String.fromCharCode(65 + index)}
                                    </span>
                                  </div>
                                                                     <div className="flex-1" style={{ fontFamily: 'serif' }}>
                                     <KaTeXDisplay content={option.content} fontFamily="serif" />
                                   </div>
                                  {showAnswers && status === 'correct' && (
                                    <FiCheck className="h-5 w-5 text-green-600 ml-2" />
                                  )}
                                  {showAnswers && status === 'incorrect' && (
                                    <FiX className="h-5 w-5 text-red-600 ml-2" />
                                  )}
                                  {showAnswers && status === 'correct-answer' && (
                                    <FiCheck className="h-5 w-5 text-green-500 ml-2" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Written Answer */}
                    {(currentQuestionData.answerType === 'written' || currentQuestionData.type === 'grid-in') && testResults && (
                      <div className="mb-6">
                        <h4 className="font-medium text-gray-900 mb-3">Your Answer</h4>
                        {getQuestionResult(`${currentSection}-${currentQuestion}`) ? (
                          <div className={`p-4 rounded-lg border-2 ${
                            isAnswerCorrect(`${currentSection}-${currentQuestion}`, getQuestionResult(`${currentSection}-${currentQuestion}`).selectedAnswer)
                              ? 'bg-green-100 border-green-400 text-green-900'
                              : 'bg-red-100 border-red-400 text-red-900'
                          }`}>
                            <p className="font-medium">
                              {getQuestionResult(`${currentSection}-${currentQuestion}`).selectedAnswer || 'No answer provided'}
                            </p>
                            <div className="mt-2 flex items-center">
                              {isAnswerCorrect(`${currentSection}-${currentQuestion}`, getQuestionResult(`${currentSection}-${currentQuestion}`).selectedAnswer) ? (
                                <>
                                  <FiCheck className="h-4 w-4 text-green-600 mr-2" />
                                  <span className="text-sm text-green-700">Correct</span>
                                </>
                              ) : (
                                <>
                                  <FiX className="h-4 w-4 text-red-600 mr-2" />
                                  <span className="text-sm text-red-700">Incorrect</span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg border-2 bg-red-100 border-red-400 text-red-900">
                            <p className="font-medium">No answer provided</p>
                            <div className="mt-2 flex items-center">
                              <FiX className="h-4 w-4 text-red-600 mr-2" />
                              <span className="text-sm text-red-700">Unanswered</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Always show correct answers for written questions when test is completed */}
                        {showAnswers && testResults && testResults.status === 'completed' && (currentQuestionData.acceptableAnswers?.length > 0 || currentQuestionData.writtenAnswer) && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-3">Correct Answer(s)</h4>
                            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                              <div className="space-y-2">
                                {/* Show writtenAnswer first if it exists */}
                                {currentQuestionData.writtenAnswer && (
                                  <p className="text-green-800 font-medium">• {currentQuestionData.writtenAnswer}</p>
                                )}
                                {/* Show all acceptable answers */}
                                {currentQuestionData.acceptableAnswers?.map((answer, index) => (
                                  <p key={index} className="text-green-800 font-medium">• {answer}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {showExplanations && currentQuestionData.explanation && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Explanation</h4>
                        <div className="text-blue-800">
                          <KaTeXDisplay content={currentQuestionData.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500">No question data available</p>
                  </div>
                )}

                {/* Question Navigation */}
                {questions.length > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => handleQuestionChange(currentQuestion - 1)}
                      disabled={currentQuestion <= 1}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="text-sm text-gray-600">
                      Question {currentQuestion} of {questions.length}
                    </div>
                    
                    <button
                      onClick={() => handleQuestionChange(currentQuestion + 1)}
                      disabled={currentQuestion >= questions.length}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Question Navigation Box */}
              <div className="xl:col-span-1">
                <div className="bg-white rounded-lg shadow p-4 sticky top-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {`Section ${currentSection + 1} Questions`}
                  </h3>
                  
                  {/* Legend */}
                  <div className="mb-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 text-white rounded mr-2 flex items-center justify-center text-xs font-medium">C</div>
                      Current
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 text-white rounded mr-2 flex items-center justify-center text-xs font-medium">✓</div>
                      Correct
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 text-white rounded mr-2 flex items-center justify-center text-xs font-medium">✗</div>
                      Incorrect
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-dashed border-gray-400 rounded mr-2 flex items-center justify-center text-xs font-medium text-gray-600">?</div>
                      Unanswered
                    </div>
                  </div>

                  {/* Question Grid */}
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((_, index) => {
                      const questionNum = index + 1;
                      const questionId = `${currentSection}-${questionNum}`;
                      const questionResult = getQuestionResult(questionId);
                      const isCorrect = questionResult ? isAnswerCorrect(questionId, questionResult.selectedAnswer) : false;
                      const hasAnswer = !!questionResult;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleQuestionChange(questionNum)}
                          className={`w-8 h-8 text-xs border-2 rounded flex items-center justify-center transition-colors ${
                            currentQuestion === questionNum
                              ? 'bg-blue-500 text-white border-blue-500'
                              : hasAnswer
                                ? isCorrect
                                  ? 'bg-green-500 text-white border-green-500'
                                  : 'bg-red-500 text-white border-red-500'
                                : 'bg-white text-gray-600 border-dashed border-gray-400'
                          }`}
                        >
                          {currentQuestion === questionNum ? 'C' : questionNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetails;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import KaTeXDisplay from '../../components/UI/KaTeXDisplay';
import { testsAPI } from '../../services/api';

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
    
    console.log('🔍 Looking for question result with ID:', questionId);
    console.log('📋 Available answer keys:', Object.keys(testResults.answers));
    
    // Try multiple formats for question ID
    let result = testResults.answers[questionId];
    if (result) {
      console.log('✅ Found result with exact ID match');
      return result;
    }
    
    // If not found, try with the current question's actual ID
    const currentQuestionData = getCurrentQuestionData();
    if (currentQuestionData && currentQuestionData.id) {
      const questionDbId = currentQuestionData.id.toString();
      result = testResults.answers[questionDbId];
      if (result) {
        console.log('✅ Found result with question DB ID:', questionDbId);
        return result;
      }
    }
    
    // If still not found, try with section-question format
    const sectionIndex = currentSection;
    const questionIndex = currentQuestion - 1;
    const formattedId = `${sectionIndex}-${questionIndex + 1}`;
    result = testResults.answers[formattedId];
    if (result) {
      console.log('✅ Found result with formatted ID:', formattedId);
      return result;
    }
    
    // Try to find by parsing the questionId and looking up the actual question
    if (questionId.includes('-')) {
      const [sectionIndex, questionIndex] = questionId.split('-').map(Number);
      const question = test?.sections?.[sectionIndex]?.questions?.[questionIndex - 1];
      if (question && question.id) {
        const questionDbId = question.id.toString();
        result = testResults.answers[questionDbId];
        if (result) {
          console.log('✅ Found result by looking up question DB ID:', questionDbId);
          return result;
        }
      }
    }
    
    console.log('❌ No result found for question ID:', questionId);
    return null;
  }, [testResults, currentSection, currentQuestion, getCurrentQuestionData, test]);

  const isAnswerCorrect = useCallback((questionId, selectedAnswer) => {
    // Parse the questionId to get section and question indices
    const [sectionIndex, questionIndex] = questionId.split('-').map(Number);
    
    console.log('🔍 Checking answer for questionId:', questionId);
    console.log('📊 Parsed indices - sectionIndex:', sectionIndex, 'questionIndex:', questionIndex);
    console.log('📋 Test sections count:', test?.sections?.length || 0);
    
    const question = test?.sections?.[sectionIndex]?.questions?.[questionIndex - 1];
    
    if (!question) {
      console.warn('❌ Question not found for ID:', questionId);
      console.log('🔍 Available sections:', test?.sections?.map((section, idx) => ({
        sectionIndex: idx,
        sectionName: section.name,
        questionsCount: section.questions?.length || 0
      })));
      
      if (test?.sections?.[sectionIndex]) {
        console.log('🔍 Section exists but question not found. Available questions in section', sectionIndex, ':', 
          test.sections[sectionIndex].questions?.length || 0);
      }
      return false;
    }
    
    console.log('✅ Question found:', question.question?.substring(0, 50) + '...');
    
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

  const calculateScore = useCallback((testData, answers) => {
    if (!testData || !answers) return 0;
    
    let totalQuestions = 0;
    let correctAnswers = 0;
    
    // Calculate score based on test structure
    if (testData.sections) {
    testData.sections.forEach((section, sectionIndex) => {
      if (section.questions) {
        section.questions.forEach((question, questionIndex) => {
            totalQuestions++;
          const questionId = `${sectionIndex}-${questionIndex + 1}`;
            const questionResult = answers[questionId];
            
            if (questionResult && isAnswerCorrect(questionId, questionResult.selectedAnswer)) {
              correctAnswers++;
            }
        });
      }
    });
    } else if (testData.questions) {
      // Handle legacy test format
      testData.questions.forEach((question, index) => {
        totalQuestions++;
        const questionId = `0-${index + 1}`;
        const questionResult = answers[questionId];
        
        if (questionResult && isAnswerCorrect(questionId, questionResult.selectedAnswer)) {
          correctAnswers++;
        }
      });
    }
    
    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  }, [isAnswerCorrect]);

  const getAnswerStatus = (questionId, optionContent) => {
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
  };

  const getQuestionBoxColor = (questionId) => {
    if (!testResults) return '';
    
    const questionResult = getQuestionResult(questionId);
    if (!questionResult) return 'border-l-4 border-red-500';
    
    const isCorrect = isAnswerCorrect(questionId, questionResult.selectedAnswer);
    return isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500';
  };

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
          console.warn('Invalid completion data structure for test:', testId);
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
              console.warn('Unknown questionKey format:', questionKey);
              questionId = questionKey?.toString() || 'unknown';
            }
            
            answers[questionId] = { selectedAnswer: answer };
          } catch (error) {
            console.warn('Error processing questionKey:', questionKey, error);
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
        
        // Calculate overall test score and metrics
        const overallScore = calculateScore(testData, answers);
        
        // Count correct and incorrect answers
        let correctCount = 0;
        let incorrectCount = 0;
        
        testData.sections?.forEach((section, sectionIndex) => {
          section.questions?.forEach((question, questionIndex) => {
            const questionId = `${sectionIndex}-${questionIndex + 1}`;
            const userAnswer = answers[questionId]?.selectedAnswer;
            
            if (userAnswer) {
              // Use the same logic as calculateScore to determine if answer is correct
              let isCorrect = false;
              
              if (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') {
                // Method 1: Check if the selected answer matches an option with isCorrect flag
                if (question.options) {
                  const selectedOption = question.options.find(opt => opt.content === userAnswer);
                  if (selectedOption && selectedOption.isCorrect === true) {
                    isCorrect = true;
                  }
                }
                
                // Method 2: Check if the selected answer matches the correctAnswer field
                if (!isCorrect) {
                  if (typeof question.correctAnswer === 'string') {
                    isCorrect = userAnswer === question.correctAnswer;
                  } else if (typeof question.correctAnswer === 'number' && question.options) {
                    const correctOption = question.options[question.correctAnswer];
                    const correctContent = correctOption?.content || correctOption;
                    isCorrect = userAnswer === correctContent;
                  } else if (typeof question.correctAnswer === 'number') {
                    isCorrect = userAnswer === question.correctAnswer.toString();
                  }
                }
                
                // Method 3: Check if the selected answer matches any option marked as correct
                if (!isCorrect && question.options) {
                  const correctOption = question.options.find(opt => opt.isCorrect === true);
                  if (correctOption && correctOption.content === userAnswer) {
                    isCorrect = true;
                  }
                }
                
                if (isCorrect) {
                  correctCount++;
                } else {
                  incorrectCount++;
                }
              } else if (question.answerType === 'written' || question.type === 'grid-in') {
                const acceptableAnswers = question.acceptableAnswers || [];
                const writtenAnswer = question.writtenAnswer || '';
                
                // Add writtenAnswer to acceptable answers if it's not already there
                const allAcceptableAnswers = [...acceptableAnswers];
                if (writtenAnswer && !acceptableAnswers.includes(writtenAnswer)) {
                  allAcceptableAnswers.push(writtenAnswer);
                }
                
                if (allAcceptableAnswers.some(answer => 
                  userAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
                )) {
                  correctCount++;
                } else {
                  incorrectCount++;
                }
              }
            } else {
              // Unanswered questions count as incorrect
              incorrectCount++;
            }
          });
        });
        
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
      console.error('Error loading test details:', error);
      setError('Failed to load test details');
    } finally {
      setLoading(false);
    }
  }, [testId, calculateScore]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTestDetails();
  }, [loadTestDetails]);

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
                              {isAnswerCorrect(`
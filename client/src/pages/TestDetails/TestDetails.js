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
  const [showExplanations, setShowExplanations] = useState(false); // Default to false, will be set based on test status
  


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
        
        // Calculate score and metrics
        // Count unique answered questions (avoid duplicates)
        const uniqueAnsweredQuestions = new Set();
        parsedData.answeredQuestions.forEach(([questionKey, answer]) => {
          try {
            if (typeof questionKey === 'string' && questionKey.includes('-')) {
              const [sectionIndex, questionNum] = questionKey.split('-').map(Number);
              uniqueAnsweredQuestions.add(`${sectionIndex}-${questionNum}`);
            }
          } catch (error) {
            console.warn('Error processing questionKey:', questionKey, error);
          }
        });
        const answeredCount = uniqueAnsweredQuestions.size;
        
        // Calculate total questions from test data sections
        const totalQuestions = testData.sections ? 
          testData.sections.reduce((total, section) => total + (section.questions?.length || 0), 0) : 
          (parsedData.totalQuestions || 0);
        
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
        
        // Add section-question format answers for timestamp-based question IDs
        Object.keys(answers).forEach(questionId => {
          if (questionIdToSectionMap[questionId]) {
            const sectionQuestionId = questionIdToSectionMap[questionId];
            answers[sectionQuestionId] = answers[questionId];
          }
        });
        
        // Calculate actual score based on correct answers
        const score = calculateScore(testData, answers);
        const correctAnswers = Math.round((score / 100) * totalQuestions);
        const incorrectAnswers = totalQuestions - correctAnswers;
        
        const resultsData = {
          testId: testId,
          userId: 'user', // Mock user ID
          score: parsedData.status === 'completed' ? score : null,
          correctAnswers: parsedData.status === 'completed' ? correctAnswers : 0,
          incorrectAnswers: parsedData.status === 'completed' ? incorrectAnswers : 0,
          totalQuestions: totalQuestions,
          completedAt: parsedData.completedAt || new Date().toISOString(),
          status: parsedData.status || 'completed',
          answers: answers,
          answeredCount: answeredCount
        };
        
        setTestResults(resultsData);
        
        // Set showExplanations based on test completion status
        setShowExplanations(parsedData.status === 'completed');
        
      } else {
        setTestResults(null);
      }
      
    } catch (error) {
      console.error('Error loading test details:', error);
      setError('Failed to load test details');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTestDetails();
  }, [loadTestDetails]);

  const getCurrentSectionData = () => {
    if (!test || !test.sections) return null;
    return test.sections[currentSection] || null;
  };

  const getCurrentSectionQuestions = () => {
    const section = getCurrentSectionData();
    if (!section || !section.questions) return [];
    return section.questions;
  };

  const getCurrentQuestionData = () => {
    const questions = getCurrentSectionQuestions();
    if (questions.length === 0) return null;
    return questions[currentQuestion - 1] || null;
  };

  const getQuestionResult = (questionId) => {
    if (!testResults || !testResults.answers) return null;
    
    // Try multiple formats for question ID
    let result = testResults.answers[questionId];
    if (result) return result;
    
    // If not found, try with the current question's actual ID
    const currentQuestionData = getCurrentQuestionData();
    if (currentQuestionData && currentQuestionData.id) {
      result = testResults.answers[currentQuestionData.id.toString()];
      if (result) return result;
    }
    
    // If still not found, try with section-question format
    const sectionIndex = currentSection;
    const questionIndex = currentQuestion - 1;
    const formattedId = `${sectionIndex}-${questionIndex + 1}`;
    return testResults.answers[formattedId] || null;
  };

  const isAnswerCorrect = (questionId, selectedAnswer) => {
    // Parse the questionId to get section and question indices
    const [sectionIndex, questionIndex] = questionId.split('-').map(Number);
    const question = test?.sections?.[sectionIndex]?.questions?.[questionIndex - 1];
    
    if (!question) {
      console.warn('Question not found for ID:', questionId);
      return false;
    }
    
    console.log('=== ANSWER CORRECTNESS CHECK ===');
    console.log('Question ID:', questionId);
    console.log('Selected Answer:', selectedAnswer);
    console.log('Question:', {
      id: question.id,
      type: question.type,
      answerType: question.answerType,
      correctAnswer: question.correctAnswer,
      options: question.options?.map(opt => opt.content || opt),
      acceptableAnswers: question.acceptableAnswers,
      writtenAnswer: question.writtenAnswer
    });
    
    // For multiple choice questions
    if (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') {
      console.log('=== ANSWER CORRECTNESS CHECK FOR MULTIPLE CHOICE ===');
      console.log('Selected Answer:', selectedAnswer);
      console.log('Question:', question);
      
      // Method 1: Check if the selected answer matches an option with isCorrect flag
      if (question.options) {
        const selectedOption = question.options.find(opt => opt.content === selectedAnswer);
        if (selectedOption && selectedOption.isCorrect === true) {
          console.log('Found correct answer via isCorrect flag:', selectedOption);
          return true;
        }
      }
      
      // Method 2: Direct string comparison with correctAnswer
      if (typeof question.correctAnswer === 'string') {
        const isCorrect = selectedAnswer === question.correctAnswer;
        console.log('String comparison:', { selectedAnswer, correctAnswer: question.correctAnswer, isCorrect });
        if (isCorrect) return true;
      }
      
      // Method 3: Index-based comparison
      if (typeof question.correctAnswer === 'number' && question.options) {
        const correctOption = question.options[question.correctAnswer];
        const correctContent = correctOption?.content || correctOption;
        const isCorrect = selectedAnswer === correctContent;
        console.log('Index-based comparison:', { 
          selectedAnswer, 
          correctAnswerIndex: question.correctAnswer, 
          correctContent, 
          isCorrect 
        });
        if (isCorrect) return true;
      }
      
      // Method 4: Number to string comparison
      if (typeof question.correctAnswer === 'number') {
        const isCorrect = selectedAnswer === question.correctAnswer.toString();
        console.log('Number comparison:', { selectedAnswer, correctAnswer: question.correctAnswer, isCorrect });
        if (isCorrect) return true;
      }
      
      // Method 5: Check if selected answer matches any acceptable answers
      if (question.acceptableAnswers && Array.isArray(question.acceptableAnswers)) {
        const isCorrect = question.acceptableAnswers.includes(selectedAnswer);
        console.log('Acceptable answers comparison:', { acceptableAnswers: question.acceptableAnswers, selectedAnswer, isCorrect });
        if (isCorrect) return true;
      }
      
      // Method 6: Check if selected answer matches writtenAnswer
      if (question.writtenAnswer) {
        const isCorrect = selectedAnswer === question.writtenAnswer;
        console.log('Written answer comparison:', { writtenAnswer: question.writtenAnswer, selectedAnswer, isCorrect });
        if (isCorrect) return true;
      }
      
      console.log('Answer is incorrect');
      return false;
    }
    
    // For written answers - check both acceptableAnswers and writtenAnswer
    if (question.answerType === 'written' || question.type === 'grid-in') {
      const acceptableAnswers = question.acceptableAnswers || [];
      const writtenAnswer = question.writtenAnswer || '';
      
      // Add writtenAnswer to acceptable answers if it's not already there
      const allAcceptableAnswers = [...acceptableAnswers];
      if (writtenAnswer && !acceptableAnswers.includes(writtenAnswer)) {
        allAcceptableAnswers.push(writtenAnswer);
      }
      
      const isCorrect = allAcceptableAnswers.some(answer => 
        selectedAnswer && selectedAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
      );
      console.log('Written answer comparison:', { 
        selectedAnswer, 
        allAcceptableAnswers, 
        isCorrect 
      });
      return isCorrect;
    }
    
    return false;
  };

  const calculateScore = (testData, answers) => {
    if (!testData || !testData.sections || !answers) return 0;
    
    let correctCount = 0;
    let totalCount = 0;
    
    testData.sections.forEach((section, sectionIndex) => {
      if (section.questions) {
        section.questions.forEach((question, questionIndex) => {
          totalCount++;
          const questionId = question.id || `${sectionIndex}-${questionIndex + 1}`;
          const userAnswer = answers[questionId]?.selectedAnswer;
          
                     if (userAnswer) {
             // Check if answer is correct
             if (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') {
               // Handle both string and index-based correct answers
               if (typeof question.correctAnswer === 'string') {
                 if (userAnswer === question.correctAnswer) {
                   correctCount++;
                 }
               } else if (typeof question.correctAnswer === 'number' && question.options) {
                 // If correctAnswer is an index, get the content from options
                 const correctOption = question.options[question.correctAnswer];
                 const correctContent = correctOption?.content || correctOption;
                 if (userAnswer === correctContent) {
                   correctCount++;
                 }
               } else if (typeof question.correctAnswer === 'number') {
                 // Handle case where correctAnswer is just a number (index)
                 if (userAnswer === question.correctAnswer.toString()) {
                   correctCount++;
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
               
               if (allAcceptableAnswers.some(answer => 
                 userAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
               )) {
                 correctCount++;
               }
             }
           }
        });
      }
    });
    
    return totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  };

  // Calculate section-specific statistics
  const getSectionStats = (sectionIndex) => {
    if (!testResults || !test?.sections) return { score: 0, correct: 0, incorrect: 0 };
    
    const section = test.sections[sectionIndex];
    if (!section?.questions) return { score: 0, correct: 0, incorrect: 0 };
    
    let correctCount = 0;
    let totalCount = section.questions.length;
    
    section.questions.forEach((question, questionIndex) => {
      const questionId = `${sectionIndex}-${questionIndex + 1}`;
      const questionResult = getQuestionResult(questionId);
      
      if (questionResult) {
        const isCorrect = isAnswerCorrect(questionId, questionResult.selectedAnswer);
        if (isCorrect) correctCount++;
      }
    });
    
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const incorrectCount = totalCount - correctCount;
    
    return {
      score,
      correct: correctCount,
      incorrect: incorrectCount
    };
  };

  const getAnswerStatus = (questionId, optionContent) => {
    const questionResult = getQuestionResult(questionId);
    
    // Parse the questionId to get section and question indices
    const [sectionIndex, questionIndex] = questionId.split('-').map(Number);
    const question = test?.sections?.[sectionIndex]?.questions?.[questionIndex - 1];
    
    if (!question) return 'unanswered';
    
    // Determine if this option is the correct answer
    let isCorrectAnswer = false;
    if (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') {
      console.log('=== QUESTION DATA DEBUG ===');
      console.log('Question:', question);
      console.log('Question correctAnswer:', question.correctAnswer);
      console.log('Question options:', question.options);
      console.log('Option content being checked:', optionContent);
      console.log('Correct answer type:', typeof question.correctAnswer);
      
      // Method 1: Check if the option has isCorrect flag
      if (question.options) {
        const currentOption = question.options.find(opt => opt.content === optionContent);
        if (currentOption && currentOption.isCorrect === true) {
          isCorrectAnswer = true;
          console.log('Found correct answer via isCorrect flag:', currentOption);
        }
      }
      
      // Method 2: Direct string comparison with correctAnswer
      if (!isCorrectAnswer && typeof question.correctAnswer === 'string') {
        isCorrectAnswer = question.correctAnswer === optionContent;
        console.log('String comparison:', { correctAnswer: question.correctAnswer, optionContent, isCorrectAnswer });
      }
      
      // Method 3: Index-based comparison
      if (!isCorrectAnswer && typeof question.correctAnswer === 'number' && question.options) {
        const correctOption = question.options[question.correctAnswer];
        const correctContent = correctOption?.content || correctOption;
        isCorrectAnswer = optionContent === correctContent;
        console.log('Index-based comparison:', { 
          correctAnswerIndex: question.correctAnswer, 
          correctOption, 
          correctContent, 
          optionContent, 
          isCorrectAnswer 
        });
      }
      
      // Method 4: Number to string comparison
      if (!isCorrectAnswer && typeof question.correctAnswer === 'number') {
        isCorrectAnswer = optionContent === question.correctAnswer.toString();
        console.log('Number comparison:', { correctAnswer: question.correctAnswer, optionContent, isCorrectAnswer });
      }
      
      // Method 5: Check if option content matches any acceptable answers
      if (!isCorrectAnswer && question.acceptableAnswers && Array.isArray(question.acceptableAnswers)) {
        isCorrectAnswer = question.acceptableAnswers.includes(optionContent);
        console.log('Acceptable answers comparison:', { acceptableAnswers: question.acceptableAnswers, optionContent, isCorrectAnswer });
      }
      
      // Method 6: Check if option content matches writtenAnswer
      if (!isCorrectAnswer && question.writtenAnswer) {
        isCorrectAnswer = optionContent === question.writtenAnswer;
        console.log('Written answer comparison:', { writtenAnswer: question.writtenAnswer, optionContent, isCorrectAnswer });
      }
      
      console.log('Final isCorrectAnswer:', isCorrectAnswer);
    }
    
    // Always show correct answers when test is completed and showAnswers is true
    if (testResults && testResults.status === 'completed' && showAnswers) {
      // If no answer was provided, show correct answer
      if (!questionResult) {
        return isCorrectAnswer ? 'correct-answer' : 'unanswered';
      }
      
      const isSelected = questionResult.selectedAnswer === optionContent;
      
      console.log('=== ANSWER STATUS CHECK ===');
      console.log('Question ID:', questionId);
      console.log('Option Content:', optionContent);
      console.log('Selected Answer:', questionResult.selectedAnswer);
      console.log('Is Selected:', isSelected);
      console.log('Is Correct Answer:', isCorrectAnswer);
      console.log('Test Status:', testResults?.status);
      console.log('Show Answers:', showAnswers);
      
      // If user selected the correct answer
      if (isSelected && isCorrectAnswer) return 'correct';
      // If user selected the wrong answer
      if (isSelected && !isCorrectAnswer) return 'incorrect';
      // If this is the correct answer but user didn't select it (or didn't answer)
      if (!isSelected && isCorrectAnswer) return 'correct-answer';
      // If user didn't select this option and it's not the correct answer
      return 'unanswered';
    }
    
    // If test is not completed or answers are hidden, don't show answers
    if (!questionResult) {
      return 'unanswered';
    }
    
    const isSelected = questionResult.selectedAnswer === optionContent;
    
    // If user selected the correct answer
    if (isSelected && isCorrectAnswer) return 'correct';
    // If user selected the wrong answer
    if (isSelected && !isCorrectAnswer) return 'incorrect';
    // If this is the correct answer but user didn't select it (or didn't answer)
    if (!isSelected && isCorrectAnswer) return 'correct-answer';
    // If user didn't select this option and it's not the correct answer
    return 'unanswered';
  };

  const getQuestionBoxColor = (questionId) => {
    const questionResult = getQuestionResult(questionId);
    
    // If no answer was provided, treat as incorrect
    if (!questionResult) {
      return 'bg-red-50 border-red-200';
    }
    
    const isCorrect = isAnswerCorrect(questionId, questionResult.selectedAnswer);
    return isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const handleQuestionChange = (questionNum) => {
    const questions = getCurrentSectionQuestions();
    if (questionNum >= 1 && questionNum <= questions.length) {
      setCurrentQuestion(questionNum);
    }
  };

  const handleSectionChange = (sectionIndex) => {
    if (sectionIndex >= 0 && sectionIndex < (test?.sections?.length || 0)) {
      setCurrentSection(sectionIndex);
      setCurrentQuestion(1);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };



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
  // eslint-disable-next-line no-unused-vars
  const currentSectionData = getCurrentSectionData();
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
                   {getSectionStats(currentSection).score}%
                 </div>
                 <div className="text-sm text-gray-600">Score</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-green-600">
                   {getSectionStats(currentSection).correct}
                 </div>
                 <div className="text-sm text-gray-600">Correct</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-red-600">
                   {getSectionStats(currentSection).incorrect}
                 </div>
                 <div className="text-sm text-gray-600">Incorrect</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-gray-600">
                   {test?.sections?.[currentSection]?.questions?.length || 0}
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

          {/* Question Content */}
          <div className="lg:col-span-3">
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
                         <div dangerouslySetInnerHTML={{ __html: currentQuestionData.passage }} />
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
                  <div className="text-gray-700 leading-relaxed">
                    <KaTeXDisplay content={currentQuestionData.question || currentQuestionData.content} />
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
                              <div className="flex-1">
                                <KaTeXDisplay content={option.content} />
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
         </div>
       </div>

       
     </div>
   );
 };

export default TestDetails; 
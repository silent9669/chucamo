import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiBookmark, 
  FiX, 
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import RichTextDocument from '../../components/UI/RichTextDocument';
import Watermark from '../../components/UI/Watermark';
import vocabQuizAPI from '../../services/vocabQuizAPI';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';
import useCopyWatermark from '../../hooks/useCopyWatermark';

const VocabQuizTaker = () => {
  const navigate = useNavigate();
  const { id: quizId } = useParams();
  const { user } = useAuth();
  
  // Apply copy watermark protection
  useCopyWatermark([
    '.reading-passage-container',
    '.question-content',
    '.answer-options'
  ]);
  
  // Quiz data state
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Quiz progress state
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Question state
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isMarkedForReview, setIsMarkedForReview] = useState(false);
  const [eliminatedAnswers, setEliminatedAnswers] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Map());
  const [markedForReviewQuestions, setMarkedForReviewQuestions] = useState(new Set());
  
  // UI state
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [showReviewPage, setShowReviewPage] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showQuestionDetails, setShowQuestionDetails] = useState(new Set());
  
  // Font size state
  const [fontSize] = useState(16);

  // Load quiz data
  const loadQuizData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vocabQuizAPI.getById(quizId);
      const quizData = response.data.quiz;
      
      if (!quizData) {
        setError('Quiz not found');
        return;
      }

      // Extract questions from the first section (vocab quizzes only have one section)
      const allQuestions = quizData.sections?.[0]?.questions || [];
      
      setQuiz(quizData);
      setQuestions(allQuestions);
      
      // Initialize timer based on quiz time limit
      if (quizData.timeLimit) {
        const quizTime = quizData.timeLimit * 60; // Convert to seconds
        setTimeLeft(quizTime);
        logger.debug('Initialized timer with', quizTime, 'seconds for quiz');
      }
      
      logger.debug('Loaded quiz data:', quizData);
      logger.debug('Questions:', allQuestions);
      
    } catch (error) {
      logger.error('Error loading quiz data:', error);
      setError('Failed to load quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  // Load saved progress
  const loadSavedProgress = useCallback(() => {
    const savedProgress = localStorage.getItem(`vocab_quiz_progress_${quizId}`);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentQuestion(progress.currentQuestion || 1);
        setTimeLeft(progress.timeLeft || (quiz.timeLimit * 60 || 0));
        setAnsweredQuestions(new Map(progress.answeredQuestions || []));
        setMarkedForReviewQuestions(new Set(progress.markedForReviewQuestions || []));
        
        // Load the current question's answer state
        const questionKey = progress.currentQuestion || 1;
        const previousAnswer = new Map(progress.answeredQuestions || []).get(questionKey);
        setSelectedAnswer(previousAnswer || null);
        setIsMarkedForReview(new Set(progress.markedForReviewQuestions || []).has(questionKey));
      } catch (error) {
        logger.error('Error loading saved progress:', error);
      }
    }
  }, [quizId, quiz]);

  // Save progress
  const saveProgress = useCallback(() => {
    if (!quiz) return;
    
    const progress = {
      currentQuestion,
      timeLeft,
      answeredQuestions: Array.from(answeredQuestions.entries()),
      markedForReviewQuestions: Array.from(markedForReviewQuestions),
      lastSaved: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(`vocab_quiz_progress_${quizId}`, JSON.stringify(progress));
    } catch (error) {
      logger.error('Error saving progress:', error);
    }
  }, [quiz, currentQuestion, timeLeft, answeredQuestions, markedForReviewQuestions, quizId]);

  // Load quiz data on component mount
  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  // Load saved progress when quiz data is available
  useEffect(() => {
    if (quiz && questions.length > 0) {
      loadSavedProgress();
    }
  }, [quiz, questions, loadSavedProgress]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!quiz || questions.length === 0) return;
    
    const autoSaveInterval = setInterval(() => {
      saveProgress();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [quiz, questions, currentQuestion, timeLeft, answeredQuestions, markedForReviewQuestions, saveProgress]);

  // Save progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (quiz && questions.length > 0) {
        saveProgress();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [quiz, questions, currentQuestion, timeLeft, answeredQuestions, markedForReviewQuestions, saveProgress]);

  // Timer countdown effect
  useEffect(() => {
    if (!quiz) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz]);

  // Handle timer reaching 0
  useEffect(() => {
    if (timeLeft === 0 && quiz && !showReviewPage && !showSummary) {
      logger.debug('Timer reached 0, automatically going to review page');
      setShowReviewPage(true);
      setShowQuestionNav(false);
    }
  }, [timeLeft, quiz, showReviewPage, showSummary]);

  // Get current question data
  const getCurrentQuestionData = () => {
    if (!questions || questions.length === 0) return null;
    return questions[currentQuestion - 1];
  };

  // Get total questions
  const getTotalQuestions = () => {
    return questions.length;
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    const questionKey = currentQuestion;
    setAnsweredQuestions(prev => new Map(prev).set(questionKey, answer));
  };

  // Handle marking for review
  const handleMarkForReview = () => {
    const questionKey = currentQuestion;
    setMarkedForReviewQuestions(prev => {
      const newSet = new Set(prev);
      if (isMarkedForReview) {
        newSet.delete(questionKey);
      } else {
        newSet.add(questionKey);
      }
      return newSet;
    });
    setIsMarkedForReview(!isMarkedForReview);
  };

  // Handle eliminating answers
  const handleEliminateAnswer = (answer) => {
    setEliminatedAnswers(prev => 
      prev.includes(answer) 
        ? prev.filter(a => a !== answer)
        : [...prev, answer]
    );
  };

  // Handle question change
  const handleQuestionChange = (questionNum) => {
    setCurrentQuestion(questionNum);
    const questionKey = questionNum;
    const previousAnswer = answeredQuestions.get(questionKey);
    
    // Reset answer states
    setSelectedAnswer(null);
    setEliminatedAnswers([]);
    
    // Load previous answer if exists
    if (previousAnswer) {
      setSelectedAnswer(previousAnswer);
    }
    
    setIsMarkedForReview(markedForReviewQuestions.has(questionKey));
    setShowQuestionNav(false);
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestion === getTotalQuestions()) {
      // If it's the last question, show review page
      setShowReviewPage(true);
    } else {
      // Move to next question
      handleQuestionChange(currentQuestion + 1);
    }
  };

  // Handle back question
  const handleBackQuestion = () => {
    if (currentQuestion > 1) {
      handleQuestionChange(currentQuestion - 1);
    }
  };

  // Go to review page
  const goToReviewPage = () => {
    setShowReviewPage(true);
    setShowQuestionNav(false);
  };

  // Handle save and exit
  const handleSaveAndExit = () => {
    // Save incomplete quiz data
    const completionData = {
      quizId,
      attemptId: Date.now(),
      completedAt: new Date().toISOString(),
      totalQuestions: getTotalQuestions(),
      answeredQuestions: Array.from(answeredQuestions.entries()),
      timeSpent: (quiz.timeLimit * 60) - timeLeft,
      status: 'incomplete',
      quizData: {
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty
      }
    };
    
    localStorage.setItem(`vocab_quiz_completion_${quizId}`, JSON.stringify(completionData));
    saveProgress();
    navigate('/vocab-quizzes');
  };

  // Handle finish quiz
  const handleFinishQuiz = () => {
    // Calculate score
    let correctAnswers = 0;
    answeredQuestions.forEach((answer, questionKey) => {
      const question = questions[questionKey - 1];
      if (question && question.options) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        if (correctOption && correctOption.content === answer) {
          correctAnswers++;
        }
      }
    });

    const score = Math.round((correctAnswers / getTotalQuestions()) * 100);
    
    // Save completion data
    const completionData = {
      quizId,
      attemptId: Date.now(),
      completedAt: new Date().toISOString(),
      totalQuestions: getTotalQuestions(),
      answeredQuestions: Array.from(answeredQuestions.entries()),
      correctAnswers,
      score,
      timeSpent: (quiz.timeLimit * 60) - timeLeft,
      status: 'completed'
    };
    
    localStorage.setItem(`vocab_quiz_completion_${quizId}`, JSON.stringify(completionData));
    
    // Show summary
    setShowSummary(true);
  };

  // Toggle question details visibility
  const toggleQuestionDetails = (questionNum) => {
    setShowQuestionDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionNum)) {
        newSet.delete(questionNum);
      } else {
        newSet.add(questionNum);
      }
      return newSet;
    });
  };

  // Format time
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get question status
  const getQuestionStatus = (questionNum) => {
    const isAnswered = answeredQuestions.has(questionNum);
    const answer = answeredQuestions.get(questionNum);
    
    if (!isAnswered) return { status: 'unanswered', color: 'gray' };
    
    const question = questions[questionNum - 1];
    if (question && question.options) {
      const correctOption = question.options.find(opt => opt.isCorrect);
      if (correctOption && correctOption.content === answer) {
        return { status: 'correct', color: 'green' };
      } else {
        return { status: 'incorrect', color: 'red' };
      }
    }
    
    return { status: 'answered', color: 'blue' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center relative">
        {/* Subtle watermark text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-gray-100 text-8xl font-bold transform -rotate-45 opacity-5">
            chucamo
          </div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vocabulary quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center relative">
        {/* Subtle watermark text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-gray-100 text-8xl font-bold transform -rotate-45 opacity-5">
            chucamo
          </div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/vocab-quizzes')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  // Summary Report
  if (showSummary) {
    const totalQuestions = getTotalQuestions();
    const correctCount = Array.from(answeredQuestions.entries()).filter(([questionKey, answer]) => {
      const question = questions[questionKey - 1];
      if (question && question.options) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        return correctOption && correctOption.content === answer;
      }
      return false;
    }).length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const timeSpent = (quiz.timeLimit * 60) - timeLeft;

    return (
      <div className="min-h-screen bg-gray-50 p-6 relative">
        {/* Subtle watermark text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-gray-100 text-8xl font-bold transform -rotate-45 opacity-5">
            chucamo
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Quiz Summary Report</h1>
            <p className="text-xl text-gray-600">{quiz.title}</p>
          </div>

          {/* Score Overview */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">{score}%</div>
                <div className="text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                <div className="text-gray-600">Correct</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{totalQuestions - correctCount}</div>
                <div className="text-gray-600">Incorrect</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{formatTime(timeSpent)}</div>
                <div className="text-gray-600">Time Used</div>
              </div>
            </div>
          </div>

          {/* Questions Overview Table */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions Overview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Your Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correct Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questions.map((question, index) => {
                    const questionNum = index + 1;
                    const status = getQuestionStatus(questionNum);
                    const userAnswer = answeredQuestions.get(questionNum);
                    const correctOption = question.options?.find(opt => opt.isCorrect);
                    
                    return (
                      <tr key={questionNum} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            Question {questionNum}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {question.question || question.content}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${
                            userAnswer ? 'text-gray-900' : 'text-gray-400 italic'
                          }`}>
                            {userAnswer || 'Not answered'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {correctOption?.content || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            status.color === 'green' ? 'bg-green-100 text-green-800' :
                            status.color === 'red' ? 'bg-red-100 text-red-800' :
                            status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleQuestionDetails(questionNum)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            {showQuestionDetails.has(questionNum) ? (
                              <>
                                <FiEyeOff className="w-4 h-4 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <FiEye className="w-4 h-4 mr-1" />
                                Show
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Question Views */}
          {questions.map((question, index) => {
            const questionNum = index + 1;
            if (!showQuestionDetails.has(questionNum)) return null;
            
            const status = getQuestionStatus(questionNum);
            const userAnswer = answeredQuestions.get(questionNum);
            
            return (
              <div key={`detail-${questionNum}`} className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Question {questionNum}</h3>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    status.color === 'green' ? 'bg-green-100 text-green-800' :
                    status.color === 'red' ? 'bg-red-100 text-red-800' :
                    status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                  </span>
                </div>

                {/* Reading Passage */}
                {question.passage && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Reading Passage:</h4>
                    <div className="prose max-w-none">
                      <RichTextDocument
                        content={question.passage}
                        fontFamily="serif"
                        fontSize={fontSize}
                        className="rich-text-content"
                      />
                    </div>
                  </div>
                )}

                {/* Question */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Question:</h4>
                  <div className="prose max-w-none">
                    <RichTextDocument
                      content={question.question || question.content}
                      fontFamily="serif"
                      fontSize={fontSize}
                      className="rich-text-content"
                    />
                  </div>
                </div>

                {/* Answer Options */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Answer Options:</h4>
                  <div className="space-y-2">
                    {question.options?.map((option, optIndex) => {
                      const isCorrect = option.isCorrect;
                      const isUserAnswer = option.content === userAnswer;
                      let bgColor = 'bg-white';
                      let borderColor = 'border-gray-300';
                      let textColor = 'text-gray-900';
                      
                      if (isCorrect) {
                        bgColor = 'bg-green-100';
                        borderColor = 'border-green-500';
                        textColor = 'text-green-800';
                      } else if (isUserAnswer && !isCorrect) {
                        bgColor = 'bg-red-100';
                        borderColor = 'border-red-500';
                        textColor = 'text-red-800';
                      }
                      
                      return (
                        <div
                          key={optIndex}
                          className={`p-3 border-2 rounded-lg ${bgColor} ${borderColor} ${textColor}`}
                        >
                          <div className="flex items-center">
                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                              isCorrect ? 'border-green-500 bg-green-500' :
                              isUserAnswer && !isCorrect ? 'border-red-500 bg-red-500' :
                              'border-gray-400'
                            }`}>
                              {isCorrect && <FiCheck className="w-3 h-3 text-white" />}
                              {isUserAnswer && !isCorrect && <FiX className="w-3 h-3 text-white" />}
                            </div>
                            <span className="font-medium">
                              {String.fromCharCode(65 + optIndex)}. {option.content}
                            </span>
                            {isCorrect && <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>}
                            {isUserAnswer && !isCorrect && <span className="ml-2 text-red-600 font-semibold">✗ Your Answer</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                    <p className="text-blue-800">{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/vocab-quizzes')}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Quizzes
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Take Quiz Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Review Page
  if (showReviewPage) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 relative">
        {/* Subtle watermark text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-gray-100 text-6xl font-bold transform -rotate-45 opacity-5">
            chucamo
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Answers</h2>
            
            <div className="space-y-4 mb-8">
              {questions.map((question, index) => {
                const questionKey = index + 1;
                const isAnswered = answeredQuestions.has(questionKey);
                const isMarked = markedForReviewQuestions.has(questionKey);
                
                return (
                  <div key={questionKey} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Question {questionKey}</span>
                      <div className="flex items-center space-x-2">
                        {isAnswered && (
                          <span className="text-green-600 text-sm">✓ Answered</span>
                        )}
                        {isMarked && (
                          <span className="text-blue-600 text-sm">📖 Marked</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-2">
                      {question.question || question.content}
                    </p>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setShowReviewPage(false)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Back to Quiz
              </button>
              <button
                onClick={handleFinishQuiz}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Finish Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionData = getCurrentQuestionData();
  if (!currentQuestionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center relative">
        {/* Subtle watermark text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-gray-100 text-8xl font-bold transform -rotate-45 opacity-5">
            chucamo
          </div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="text-red-600 text-xl mb-4">No questions found in this quiz</div>
          <button
            onClick={() => navigate('/vocab-quizzes')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Subtle watermark text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-gray-100 text-6xl font-bold transform -rotate-45 opacity-5">
          chucamo
        </div>
      </div>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/vocab-quizzes')}
              className="text-gray-600 hover:text-gray-900"
            >
              <FiX className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-600">Question {currentQuestion} of {getTotalQuestions()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Timer */}
            <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg font-mono">
              {formatTime(timeLeft)}
            </div>
            
            {/* Mark for Review */}
            <button
              onClick={handleMarkForReview}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isMarkedForReview 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FiBookmark className={`w-4 h-4 mr-2 ${isMarkedForReview ? 'fill-current' : ''}`} />
              Review
            </button>
            
            {/* Question Navigation */}
            <button
              onClick={() => setShowQuestionNav(!showQuestionNav)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {showQuestionNav ? 'Hide' : 'Show'} Navigation
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6 relative">
          <div className="max-w-4xl mx-auto relative z-10">
            {/* Watermark */}
            <Watermark 
              userEmail={user?.email} 
              hasImages={false}
            />
            
            {/* Additional subtle watermark text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="text-gray-100 text-6xl font-bold transform -rotate-45 opacity-5">
                chucamo
              </div>
            </div>
            
            {/* Reading Passage */}
            {currentQuestionData.passage && (
              <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 reading-passage-container">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Passage</h3>
                <div className="prose max-w-none">
                  <RichTextDocument
                    content={currentQuestionData.passage}
                    fontFamily="serif"
                    fontSize={fontSize}
                    className="rich-text-content"
                  />
                </div>
              </div>
            )}
            
            {/* Question */}
            <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question {currentQuestion}</h3>
              <div className="question-content text-gray-900 text-base leading-relaxed">
                <RichTextDocument
                  content={currentQuestionData.question || currentQuestionData.content}
                  fontFamily="serif"
                  fontSize={fontSize}
                  className="rich-text-content"
                />
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-3 answer-options">
              {currentQuestionData.options && currentQuestionData.options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <button
                    onClick={() => handleAnswerSelect(option.content || '')}
                    className={`flex-1 flex items-center p-4 border rounded-lg text-left transition-colors ${
                      selectedAnswer === (option.content || '')
                        ? 'border-blue-500 bg-blue-50'
                        : eliminatedAnswers.includes(option.content || '')
                        ? 'border-red-300 bg-red-50 opacity-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      selectedAnswer === (option.content || '')
                        ? 'border-blue-500 bg-blue-500'
                        : eliminatedAnswers.includes(option.content || '')
                        ? 'border-red-300 bg-red-300'
                        : 'border-gray-400'
                    }`}>
                      {selectedAnswer === (option.content || '') && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                      )}
                      {eliminatedAnswers.includes(option.content || '') && (
                        <FiX className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-gray-900 text-base ${
                        eliminatedAnswers.includes(option.content || '') ? 'line-through' : ''
                      }`} style={{ fontFamily: 'serif', fontSize: `${fontSize}px` }}>
                        {option.content || ''}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleEliminateAnswer(option.content || '')}
                    className="ml-3 p-3 text-gray-600 hover:text-red-600"
                  >
                    {eliminatedAnswers.includes(option.content || '') ? 'Undo' : '✕'}
                  </button>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBackQuestion}
                disabled={currentQuestion === 1}
                className={`px-6 py-3 rounded-lg ${
                  currentQuestion === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <FiChevronLeft className="w-4 h-4 mr-2 inline" />
                Previous
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveAndExit}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Save & Exit
                </button>
                
                <button
                  onClick={currentQuestion === getTotalQuestions() ? goToReviewPage : handleNextQuestion}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {currentQuestion === getTotalQuestions() ? 'Review' : 'Next'}
                  {currentQuestion !== getTotalQuestions() && <FiChevronRight className="w-4 h-4 ml-2 inline" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Question Navigation Sidebar */}
        {showQuestionNav && (
          <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto relative">
            {/* Subtle watermark text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="text-gray-100 text-4xl font-bold transform -rotate-45 opacity-5">
                chucamo
              </div>
            </div>
            
            <div className="relative z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Navigation</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, index) => {
                const questionNum = index + 1;
                const isAnswered = answeredQuestions.has(questionNum);
                const isMarked = markedForReviewQuestions.has(questionNum);
                const isCurrent = questionNum === currentQuestion;
                
                return (
                  <button
                    key={questionNum}
                    onClick={() => handleQuestionChange(questionNum)}
                    className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isAnswered
                        ? 'bg-green-100 text-green-800'
                        : isMarked
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {questionNum}
                  </button>
                );
              })}
            </div>
            
                         <div className="mt-6 space-y-2">
               <div className="flex items-center text-sm">
                 <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                 <span className="text-gray-600">Answered</span>
               </div>
               <div className="flex items-center text-sm">
                 <div className="w-4 h-4 bg-blue-100 rounded mr-2"></div>
                 <span className="text-gray-600">Marked for Review</span>
               </div>
               <div className="flex items-center text-sm">
                 <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                 <span className="text-gray-600">Not Answered</span>
               </div>
             </div>
           </div>
         </div>
         )}
       </div>
     </div>
   );
 };

export default VocabQuizTaker;

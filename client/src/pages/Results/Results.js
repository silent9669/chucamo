import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiBarChart2, FiClock, FiCheckCircle, FiXCircle, FiCalendar, FiTrash2, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { testsAPI, resultsAPI } from '../../services/api';
import logger from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';

// Performance Breakdown Chart Component
const PerformanceBreakdownChart = ({ test }) => {
  const [testData, setTestData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Helper function to get test completion data (same as Test Review page)
  const getTestCompletionData = () => {
    try {
      const completionData = localStorage.getItem(`test_completion_${test.id}`);
              if (!completionData) {
          return null;
        }
        
        const parsedData = JSON.parse(completionData);
        
        const answers = {};
        
        // Convert answeredQuestions array to answers object (same logic as Test Review)
        if (parsedData.answeredQuestions && Array.isArray(parsedData.answeredQuestions)) {
          parsedData.answeredQuestions.forEach(([questionKey, answerData]) => {
            try {
              let actualAnswer = answerData;
              if (answerData && typeof answerData === 'object' && answerData.answer) {
                actualAnswer = answerData.answer;
              }
              answers[questionKey] = { selectedAnswer: actualAnswer };
            } catch (error) {
              console.warn('Error processing answer data:', error);
            }
          });
        }
        
        return { answers, parsedData };
    } catch (error) {
      console.warn('Error loading test completion data:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load test data
        const testResponse = await testsAPI.getById(test.id);
        setTestData(testResponse.data.test);
        
        // Load result data from database if available
        if (test.resultId) {
          try {
            const resultResponse = await resultsAPI.getById(test.resultId);
            setResultData(resultResponse.data.result);
      } catch (error) {
            console.log('No database result found, using localStorage fallback');
          }
        }
      } catch (error) {
        logger.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (test.id) {
      loadData();
    }
  }, [test.id]);

  const calculatePerformanceByCategory = () => {
    if (!testData || !testData.sections) return { english: [], math: [] };

    // Define categories at the top level so they're available in all code paths
    const englishCategories = [
      { name: 'Information and Ideas', percentage: 26, questions: '12-14' },
      { name: 'Craft and Structure', percentage: 28, questions: '13-15' },
      { name: 'Expression of Ideas', percentage: 20, questions: '8-12' },
      { name: 'Standard English Conventions', percentage: 26, questions: '11-15' }
    ];

    const mathCategories = [
      { name: 'Algebra', percentage: 35, questions: '13-15' },
      { name: 'Advanced Math', percentage: 35, questions: '13-15' },
      { name: 'Problem-Solving and Data Analysis', percentage: 15, questions: '5-7' },
      { name: 'Geometry and Trigonometry', percentage: 15, questions: '5-7' }
    ];

    // PRIORITY 1: Always use localStorage test completion data for view score (same as Test Review page)
    const completionData = getTestCompletionData();
    if (completionData) {
      const { answers } = completionData;
      
      // Calculate performance for each category using localStorage data
      const calculateCategoryPerformance = (categories, sectionType) => {
        return categories.map(category => {
          let correctCount = 0;
          let totalCount = 0;

          testData.sections.forEach((section, sectionIndex) => {
            if (section.type === sectionType) {
              section.questions?.forEach((question, questionIndex) => {
                const questionKey = `${sectionIndex}-${questionIndex + 1}`;
                const userAnswer = answers[questionKey];
                
                // Always count total questions for this category, regardless of whether they were answered
                const topicMatch = question.topic === category.name;
                const contentMatch = question.content?.toLowerCase().includes(category.name.toLowerCase()) ||
                                   question.question?.toLowerCase().includes(category.name.toLowerCase());
                
                if (topicMatch || contentMatch) {
                  totalCount++; // Count ALL questions in this category
                  
                  if (userAnswer) {
                    // Only check correctness if the question was answered
                    const isCorrect = question.correctAnswer === userAnswer.selectedAnswer ||
                                     question.options?.find(opt => opt.isCorrect)?.content === userAnswer.selectedAnswer;
                    if (isCorrect) correctCount++;
                  }
                }
              });
            }
          });

          const performance = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
          const scoreRange = getScoreRange(performance);

          return {
            ...category,
            correctCount,
            totalCount,
            performance,
            scoreRange
          };
        });
      };

      return {
        english: calculateCategoryPerformance(englishCategories, 'english'),
        math: calculateCategoryPerformance(mathCategories, 'math')
      };
    }

    // PRIORITY 2: Fallback to database result data (only if no localStorage data)
    if (resultData && resultData.questionResults) {

      // Calculate performance for each category using database data
      const calculateCategoryPerformance = (categories, sectionType) => {
        return categories.map(category => {
          let correctCount = 0;
          let totalCount = 0;

          testData.sections.forEach((section, sectionIndex) => {
            if (section.type === sectionType) {
              section.questions?.forEach((question, questionIndex) => {
                // Always count total questions for this category, regardless of whether they were answered
                totalCount++;
                
                // Check if this question was answered correctly in the database result
                const questionResult = resultData.questionResults.find(qr => {
                  // Handle both direct question reference and nested question object
                  const questionId = qr.question?._id?.toString() || qr.question?.toString();
                  return questionId === question._id?.toString();
                });
                
                if (questionResult && questionResult.isCorrect && !questionResult.isUnanswered) {
                  correctCount++;
                }
              });
            }
          });

          const performance = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
          const scoreRange = getScoreRange(performance);

          return {
            ...category,
            correctCount,
            totalCount,
            performance,
            scoreRange
          };
        });
      };

      return {
        english: calculateCategoryPerformance(englishCategories, 'english'),
        math: calculateCategoryPerformance(mathCategories, 'math')
      };
    }

    // PRIORITY 3: Final fallback - return empty arrays if no data available
    return { english: [], math: [] };
  };

  const getScoreRange = (performance) => {
    if (performance >= 90) return '680-800';
    if (performance >= 80) return '610-670';
    if (performance >= 70) return '550-600';
    if (performance >= 60) return '420-480';
    if (performance >= 50) return '350-410';
    return '200-340';
  };

  const getPerformanceBars = (performance) => {
    const bars = [];
    const filledBars = Math.round((performance / 100) * 5);
    
    for (let i = 0; i < 5; i++) {
      bars.push(
        <div
          key={i}
          className={`h-3 w-8 rounded-sm ${
            i < filledBars ? 'bg-black' : 'bg-gray-200'
          }`}
        />
      );
    }
    return bars;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const performance = calculatePerformanceByCategory();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-lg font-bold text-gray-900 mb-4">Performance Breakdown</h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reading and Writing Section */}
        <div>
          <h5 className="text-base font-bold text-gray-900 mb-3">Reading and Writing</h5>
          <div className="space-y-3">
            {performance.english.map((category, index) => (
              <div key={index} className="border-b border-gray-100 pb-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h6 className="font-medium text-gray-900 text-sm">{category.name}</h6>
                    <p className="text-xs text-gray-500">
                      ({category.percentage}% of test section, {category.questions} questions)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{category.performance}%</div>
                    <div className="text-xs text-gray-500">{category.scoreRange}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {getPerformanceBars(category.performance)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Math Section */}
        <div>
          <h5 className="text-base font-bold text-gray-900 mb-3">Math</h5>
          <div className="space-y-3">
            {performance.math.map((category, index) => (
              <div key={index} className="border-b border-gray-100 pb-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h6 className="font-medium text-gray-900 text-sm">{category.name}</h6>
                    <p className="text-xs text-gray-500">
                      ({category.percentage}% of test section, {category.questions} questions)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{category.performance}%</div>
                    <div className="text-xs text-gray-500">{category.scoreRange}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {getPerformanceBars(category.performance)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Details Component
const SectionDetails = ({ test }) => {
  const [testData, setTestData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Helper function to get test completion data (same as Test Review page)
  const getTestCompletionData = () => {
    try {
      const completionData = localStorage.getItem(`test_completion_${test.id}`);
      if (!completionData) {
        return null;
      }
      
      const parsedData = JSON.parse(completionData);
      
      const answers = {};
      
      // Convert answeredQuestions array to answers object (same logic as Test Review)
      if (parsedData.answeredQuestions && Array.isArray(parsedData.answeredQuestions)) {
        parsedData.answeredQuestions.forEach(([questionKey, answerData]) => {
          try {
            let actualAnswer = answerData;
            if (answerData && typeof answerData === 'object' && answerData.answer) {
              actualAnswer = answerData.answer;
            }
            answers[questionKey] = { selectedAnswer: actualAnswer };
        } catch (error) {
            console.warn('Error processing answer data:', error);
          }
        });
      }
      return { answers, parsedData };
    } catch (error) {
      console.warn('Error loading test completion data:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load test data
        const testResponse = await testsAPI.getById(test.id);
        setTestData(testResponse.data.test);
        
        // Load result data from database if available
        if (test.resultId) {
          try {
            const resultResponse = await resultsAPI.getById(test.resultId);
            setResultData(resultResponse.data.result);
      } catch (error) {
            console.log('No database result found, using localStorage fallback');
          }
        }
      } catch (error) {
        logger.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (test.id) {
      loadData();
    }
  }, [test.id]);

  const getSectionStats = () => {
    if (!testData || !testData.sections) return [];

    // PRIORITY 1: Always use localStorage test completion data for view score (same as Test Review page)
    const completionData = getTestCompletionData();
    if (completionData) {
      const { answers } = completionData;
      
      return testData.sections.map((section, sectionIndex) => {
        let correctCount = 0;
        let totalCount = 0;

        section.questions?.forEach((question, questionIndex) => {
          const questionKey = `${sectionIndex}-${questionIndex + 1}`;
          const userAnswer = answers[questionKey];
          
          if (userAnswer) {
            totalCount++;
            // Use the same logic as Test Review page to determine correctness
            const isCorrect = question.correctAnswer === userAnswer.selectedAnswer ||
                             question.options?.find(opt => opt.isCorrect)?.content === userAnswer.selectedAnswer;
            if (isCorrect) correctCount++;
          }
        });

        const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

        return {
          name: section.name,
          type: section.type,
          correctCount,
          totalCount,
          percentage,
          questionCount: section.questions?.length || 0
        };
      });
    }

    // PRIORITY 2: Fallback to database result data (only if no localStorage data)
    if (resultData && resultData.questionResults) {
      return testData.sections.map((section, sectionIndex) => {
        let correctCount = 0;
        let totalCount = section.questions?.length || 0;

        // Count correct answers from database result
        resultData.questionResults.forEach(qr => {
          // Handle both direct question reference and nested question object
          const questionId = qr.question?._id?.toString() || qr.question?.toString();
          
          if (questionId && !qr.isUnanswered) {
            // Check if this question belongs to this section
            const questionInSection = section.questions?.find(q => 
              q._id?.toString() === questionId
            );
            if (questionInSection && qr.isCorrect) {
              correctCount++;
            }
          }
        });

        const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

        return {
          name: section.name,
          type: section.type,
          correctCount,
          totalCount,
          percentage,
          questionCount: totalCount
        };
      });
    }

    // PRIORITY 3: Final fallback - return empty array if no data available
    return [];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sectionStats = getSectionStats();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-lg font-bold text-gray-900 mb-4">Section Details</h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reading and Writing Sections */}
        <div>
          <h5 className="text-base font-bold text-gray-900 mb-3">Reading and Writing</h5>
          <div className="space-y-3">
            {sectionStats
              .filter(section => section.type === 'english')
              .map((section, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="font-medium text-gray-900 text-sm">Section {sectionStats.indexOf(section) + 1}</h6>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Reading & Writing
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{section.name}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Correct Answers:</span>
                      <span className="font-medium">{section.correctCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Total Questions:</span>
                      <span className="font-medium">{section.questionCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Performance:</span>
                      <span className="font-medium text-blue-600">{section.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Math Sections */}
        <div>
          <h5 className="text-base font-bold text-gray-900 mb-3">Math</h5>
          <div className="space-y-3">
            {sectionStats
              .filter(section => section.type === 'math')
              .map((section, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="font-medium text-gray-900 text-sm">Section {sectionStats.indexOf(section) + 1}</h6>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Math
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{section.name}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Correct Answers:</span>
                      <span className="font-medium">{section.correctCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Total Questions:</span>
                      <span className="font-medium">{section.questionCount}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Performance:</span>
                      <span className="font-medium text-blue-600">{section.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Results = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [testHistory, setTestHistory] = useState([]);
  const [filteredTestHistory, setFilteredTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [showTestDetails, setShowTestDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadTestHistory();
  }, []);

  const loadTestHistory = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from database first
      const response = await resultsAPI.getAll();
      
      if (response.data.results && response.data.results.length > 0) {
        // Transform database results to match our UI format
        const transformedResults = await transformDatabaseResults(response.data.results);
        
        if (transformedResults.length > 0) {
          setTestHistory(transformedResults);
          setFilteredTestHistory(transformedResults);
          return; // Successfully loaded from database
        } else {
          logger.warn('Database results transformed to empty array, falling back to localStorage');
        }
      } else {
        logger.info('No database results found, falling back to localStorage');
      }
      
      // Fallback to localStorage if database fails or is empty
      await loadFromLocalStorage();
      
    } catch (error) {
      logger.error('Error loading from database:', error);
      // Always try localStorage as fallback
      try {
        await loadFromLocalStorage();
      } catch (localStorageError) {
        logger.error('Error loading from localStorage fallback:', localStorageError);
        setError('Failed to load test history from both database and local storage');
      }
    } finally {
      setLoading(false);
    }
  };

  const transformDatabaseResults = async (dbResults) => {
    const transformedResults = [];
    
    for (const result of dbResults) {
      try {
        // Validate that result.test exists and is a valid ID
        if (!result.test || result.test === 'null' || result.test === 'undefined') {
          logger.warn(`Skipping result ${result._id} - invalid test reference:`, result.test);
          continue;
        }
        
        // Handle both string IDs and ObjectId objects
        let testId;
        if (typeof result.test === 'string') {
          testId = result.test;
        } else if (result.test && result.test._id) {
          testId = result.test._id.toString();
        } else {
          logger.warn(`Skipping result ${result._id} - cannot extract test ID from:`, result.test);
          continue;
        }
        
        // Validate testId format
        if (!testId || testId === 'null' || testId === 'undefined' || testId.length < 10) {
          logger.warn(`Skipping result ${result._id} - invalid test ID format:`, testId);
          continue;
        }
        
        // Get test details
        const testResponse = await testsAPI.getById(testId);
        const testData = testResponse.data.test;
        
        // Transform the result
        const transformedResult = {
          id: testId,
          resultId: result._id,
          title: testData.title || testData.testName,
          type: testData.type || 'custom',
          completed: result.status === 'completed',
          status: result.status || 'incomplete',
          score: result.percentage || null,
          correctAnswers: result.analytics?.correctAnswers || 0,
          incorrectAnswers: result.analytics?.incorrectAnswers || 0,
          totalQuestions: result.analytics?.totalQuestions || 0,
          answeredQuestions: result.analytics?.correctAnswers + result.analytics?.incorrectAnswers || 0,
          completedAt: result.endTime || result.completedAt,
          startedAt: result.startTime || result.startedAt,
          createdAt: result.createdAt,
          databaseResult: true,
          attemptNumber: result.attemptNumber || 1
        };
        
        transformedResults.push(transformedResult);
      } catch (error) {
        logger.error(`Error transforming result ${result._id}:`, error);
        // Continue with other results instead of failing completely
      }
    }
    
    return transformedResults;
  };

  const loadFromLocalStorage = async () => {
    try {
      // Get all test completion data from localStorage
      const completionKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('test_completion_')
      );
      
      const testHistoryData = [];
      
      for (const key of completionKeys) {
        try {
          const completionData = JSON.parse(localStorage.getItem(key));
          
          // Validate completion data structure
          if (!completionData || !Array.isArray(completionData.answeredQuestions)) {
            logger.warn('Invalid completion data structure for key:', key);
            continue;
          }
          
          // Extract testId from the format: test_completion_${testId}
          const testId = key.replace('test_completion_', '');
          const attemptId = completionData.attemptId || Date.now();
          
          // Try to get test details from API
          try {
            const testResponse = await testsAPI.getById(testId);
            const testData = testResponse.data.test;
            
                         // Calculate score and other metrics
             // Count unique answered questions (avoid duplicates)
             const uniqueAnsweredQuestions = new Set();
            completionData.answeredQuestions.forEach(([questionKey, answerData]) => {
               try {
                 if (typeof questionKey === 'string' && questionKey.includes('-')) {
                  // Format: "section-question" (e.g., "0-1")
                   const [sectionIndex, questionNum] = questionKey.split('-').map(Number);
                   uniqueAnsweredQuestions.add(`${sectionIndex}-${questionNum}`);
                 }
               } catch (error) {
                 logger.warn('Error processing questionKey:', questionKey, error);
               }
             });
             const answeredCount = uniqueAnsweredQuestions.size;
             
             // Calculate total questions from test data sections
             const totalQuestions = testData.sections ? 
               testData.sections.reduce((total, section) => total + (section.questions?.length || 0), 0) : 
               (completionData.totalQuestions || 0);
            
            // Convert answeredQuestions array to answers object for scoring
            const answers = {};
            completionData.answeredQuestions.forEach(([questionKey, answerData]) => {
              try {
                // Handle both old format (string) and new format (object with answer property)
                let actualAnswer = answerData;
                if (answerData && typeof answerData === 'object' && answerData.answer) {
                  actualAnswer = answerData.answer;
                }
                
                // Handle different questionKey formats
                let questionId;
                
                if (typeof questionKey === 'string' && questionKey.includes('-')) {
                  // Format: "section-question" (e.g., "0-1")
                  const [sectionIndex, questionNum] = questionKey.split('-').map(Number);
                  questionId = `${sectionIndex}-${questionNum}`;
                } else if (typeof questionKey === 'number' || typeof questionKey === 'string') {
                  // Format: numeric ID (e.g., 1754466772119)
                  // We'll use this as the question ID directly
                  questionId = questionKey.toString();
                } else {
                  // Fallback for unknown formats
                  logger.warn('Unknown questionKey format:', questionKey);
                  questionId = questionKey?.toString() || 'unknown';
                }
                
                answers[questionId] = { selectedAnswer: actualAnswer };
              } catch (error) {
                logger.warn('Error processing questionKey:', questionKey, error);
                const questionId = questionKey?.toString() || 'unknown';
                answers[questionId] = { selectedAnswer: answerData };
              }
            });
            
            // Calculate actual score based on correct answers
            let score = 0;
            let correctAnswers = 0;
            
            if (testData.sections) {
              testData.sections.forEach((section, sectionIndex) => {
                if (section.questions) {
                  section.questions.forEach((question, questionIndex) => {
                    // Try multiple ways to match the question
                    const possibleQuestionIds = [
                      question.id?.toString(),
                      `${sectionIndex}-${questionIndex + 1}`,
                      question.id // Keep original format if it's a number
                    ].filter(Boolean);
                    
                    // Find the matching answer
                    let userAnswer = null;
                    for (const questionId of possibleQuestionIds) {
                      if (answers[questionId]) {
                        userAnswer = answers[questionId].selectedAnswer;
                        break;
                      }
                    }
                    
                    if (userAnswer) {
                      // Check if answer is correct
                      if (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') {
                        // Handle both string and index-based correct answers
                        if (typeof question.correctAnswer === 'string') {
                          if (userAnswer === question.correctAnswer) {
                            correctAnswers++;
                          }
                        } else if (typeof question.correctAnswer === 'number' && question.options) {
                          // If correctAnswer is an index, get the content from options
                          const correctOption = question.options[question.correctAnswer];
                          const correctContent = correctOption?.content || correctOption;
                          if (userAnswer === correctContent) {
                            correctAnswers++;
                          }
                        } else if (typeof question.correctAnswer === 'number') {
                          // Handle case where correctAnswer is just a number (index)
                          if (userAnswer === question.correctAnswer.toString()) {
                            correctAnswers++;
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
                          correctAnswers++;
                        }
                      }
                    }
                  });
                }
              });
              
              score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
            }
            
            testHistoryData.push({
              id: testId,
              attemptId: attemptId,
              title: testData.title || testData.testName,
              type: testData.type || 'custom',
              completed: completionData.status === 'completed',
              status: completionData.status || 'completed',
              score: completionData.status === 'completed' ? score : null,
              correctAnswers: completionData.status === 'completed' ? correctAnswers : 0,
              incorrectAnswers: completionData.status === 'completed' ? (totalQuestions - correctAnswers) : 0,
              totalQuestions: totalQuestions,
              answeredQuestions: answeredCount,
              completedAt: completionData.completedAt,
              startedAt: completionData.startedAt || completionData.completedAt,
              createdAt: testData.createdAt || completionData.completedAt,
              // Add localStorage-specific fields
              localStorageData: true,
              localStorageKey: key
            });
          } catch (apiError) {
            logger.error(`Error fetching test ${testId}:`, apiError);
            // Add with basic info if API fails
            testHistoryData.push({
              id: testId,
              attemptId: attemptId,
              title: `Test ${testId} (${completionData.completedAt ? new Date(completionData.completedAt).toLocaleDateString() : 'Unknown Date'})`,
              type: 'custom',
              completed: completionData.status === 'completed',
              status: completionData.status || 'completed',
              score: null,
              correctAnswers: 0,
              incorrectAnswers: 0,
              totalQuestions: completionData.totalQuestions || 0,
              answeredQuestions: completionData.answeredQuestions.length,
              completedAt: completionData.completedAt,
              startedAt: completionData.startedAt || completionData.completedAt,
              createdAt: completionData.completedAt,
              // Add localStorage-specific fields
              localStorageData: true,
              localStorageKey: key
            });
          }
        } catch (parseError) {
          logger.error('Error parsing completion data:', parseError);
        }
      }
      
      // Sort by completion date (newest first)
      testHistoryData.sort((a, b) => 
        new Date(b.completedAt || b.startedAt) - new Date(a.completedAt || b.startedAt)
      );
      
      setTestHistory(testHistoryData);
      setFilteredTestHistory(testHistoryData);
    } catch (error) {
      logger.error('Error loading from localStorage:', error);
      setError('Failed to load test history from localStorage');
    }
  };

  // Filter test history based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTestHistory(testHistory);
    } else {
      const filtered = testHistory.filter(test => 
        test.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTestHistory(filtered);
    }
    // Reset to first page when filtering
    setCurrentPage(1);
  }, [searchTerm, testHistory]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTestHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTests = filteredTestHistory.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of the table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(totalPages);
  const goToPreviousPage = () => handlePageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => handlePageChange(Math.min(totalPages, currentPage + 1));

  const handleViewScore = (test) => {
    if (test.status === 'incomplete') {
      alert('Please finish your undone test first before viewing the score.');
      return;
    }
    setSelectedTest(test);
    setShowScoreModal(true);
  };

  const handleViewTestDetails = (test) => {
    setSelectedTest(test);
    setShowTestDetails(true);
    // Navigate to test details page with test ID
    navigate(`/test-details/${test.id}`);
  };

  const handleDeleteTest = async (test) => {
    if (window.confirm(`Are you sure you want to delete the test result for "${test.title}"? This action cannot be undone.`)) {
      try {
        // If it's a database result, try to delete from database first
        if (test.databaseResult && test.resultId) {
          try {
            await resultsAPI.delete(test.resultId);
            logger.info(`Successfully deleted database result ${test.resultId} for test ${test.id}`);
          } catch (dbError) {
            logger.error('Failed to delete from database:', dbError);
            // Continue with localStorage deletion even if database deletion fails
          }
        }
        
      // Remove from localStorage
        if (test.localStorageKey) {
          localStorage.removeItem(test.localStorageKey);
        } else {
      localStorage.removeItem(`test_completion_${test.id}`);
        }
      localStorage.removeItem(`test_progress_${test.id}`);
      
      // Remove from state
      setTestHistory(prev => prev.filter(t => t.id !== test.id));
        setFilteredTestHistory(prev => prev.filter(t => t.id !== test.id));
        
        logger.info(`Test result deleted successfully for: ${test.title}`);
      } catch (error) {
        logger.error('Error deleting test result:', error);
        alert('Failed to delete test result. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTestStatus = (test) => {
    if (test.status === 'completed') {
      return { status: 'Completed', icon: <FiCheckCircle className="text-green-500" />, color: 'text-green-600' };
    } else if (test.status === 'incomplete') {
      return { 
        status: `${test.answeredQuestions}/${test.totalQuestions} questions`, 
        icon: <FiClock className="text-yellow-500" />, 
        color: 'text-yellow-600' 
      };
    } else {
      return { status: 'Incomplete', icon: <FiClock className="text-yellow-500" />, color: 'text-yellow-600' };
    }
  };

  const getCompletionPercentage = (test) => {
    if (!test.totalQuestions || test.totalQuestions === 0) return 0;
    const answeredCount = test.answeredQuestions || 0;
    const percentage = Math.round((answeredCount / test.totalQuestions) * 100);
    // Ensure percentage doesn't exceed 100%
    return Math.min(percentage, 100);
  };

  const getTestTypeDisplayName = (type) => {
    switch (type) {
      case 'full':
        return 'Full SAT Test';
      case 'math':
        return 'Math Section';
      case 'reading':
        return 'Reading Section';
      case 'writing':
        return 'Writing Section';
      case 'custom':
        return 'Practice Test';
      case 'study-plan':
        return 'Study Plan';
      default:
        return 'Practice Test';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiXCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
          <button 
            onClick={loadTestHistory}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FiBarChart2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Results & Analytics</h1>
            </div>
            <div className="flex items-center space-x-3">

            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiCheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Tests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredTestHistory.filter(test => test.completed).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FiClock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Incomplete Tests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredTestHistory.filter(test => !test.completed).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiBarChart2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{filteredTestHistory.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Test History</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search tests by name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FiXCircle size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredTestHistory.length === 0 ? (
            <div className="p-8 text-center">
              <FiBarChart2 className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">No test history found</p>
              <button
                onClick={() => navigate('/tests')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Take Your First Test
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentTests.map((test) => {
                      const status = getTestStatus(test);
                      const completionPercentage = getCompletionPercentage(test);
                      
                      return (
                        <tr key={test.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {test.title || test.testName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {getTestTypeDisplayName(test.type)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {status.icon}
                              <span className={`ml-2 text-sm font-medium ${status.color}`}>
                                {status.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${completionPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{completionPercentage}%</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {test.answeredQuestions || 0} / {test.totalQuestions || 0} questions
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <FiCalendar className="h-4 w-4 mr-1" />
                              {formatDate(test.completedAt || test.startedAt || test.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewScore(test)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                              >
                                <FiBarChart2 className="h-3 w-3 mr-1" />
                                View Score
                              </button>
                              <button
                                onClick={() => handleViewTestDetails(test)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                              >
                                <FiEye className="h-3 w-3 mr-1" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleDeleteTest(test)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                              >
                                <FiTrash2 className="h-3 w-3 mr-1" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="bg-white px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-700">
                      <span>
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredTestHistory.length)} of {filteredTestHistory.length} results
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* First Page Button */}
                      <button
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md text-sm font-medium transition-colors ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <FiChevronLeft className="h-4 w-4" />
                      </button>
                      
                      {/* Previous Page Button */}
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      {/* Next Page Button */}
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Next
                      </button>
                      
                      {/* Last Page Button */}
                      <button
                        onClick={goToLastPage}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <FiChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

             {/* Enhanced Score Modal */}
       {showScoreModal && selectedTest && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-4 border w-10/12 max-w-5xl shadow-lg rounded-md bg-white">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-gray-900">
                 Performance Breakdown - {selectedTest.title}
               </h3>
               <button
                 onClick={() => setShowScoreModal(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <FiX className="h-5 w-5" />
               </button>
             </div>
             
             {selectedTest.completed ? (
               <div className="space-y-4">
                 {/* Performance Breakdown Chart */}
                 <PerformanceBreakdownChart test={selectedTest} />
                 
                 {/* Section Details */}
                 <SectionDetails test={selectedTest} />
               </div>
             ) : (
               <div className="text-center py-8">
                 <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                   <FiClock className="h-6 w-6 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-medium text-gray-900 mb-2">
                   Test Incomplete
                 </h3>
                 <p className="text-gray-500 mb-4">
                   This test was not completed. Complete the test to see your detailed performance breakdown.
                 </p>
                 <div className="text-2xl font-bold text-gray-300">--</div>
                 <p className="text-sm text-gray-400">No score available</p>
               </div>
             )}
           </div>
         </div>
       )}
    </div>
  );
};

export default Results; 
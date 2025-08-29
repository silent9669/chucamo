import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiClock, FiPlay, FiFilter, FiSearch, FiChevronLeft, FiChevronRight, FiStar, FiArrowRight } from 'react-icons/fi';
import { testsAPI } from '../../services/api';
import logger from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';
import TestCacheManager from '../../utils/testCacheManager';

const Tests = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testTypeFilter, setTestTypeFilter] = useState('practice'); // Default to practice tests instead of 'all'
  const [searchTerm, setSearchTerm] = useState(''); // Search by test name
  const [sectionFilter, setSectionFilter] = useState('all'); // Filter by section type for mock tests: 'all', 'english', 'math'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // Show 9 tests per page (3x3 grid)

  // Check if user is free account
  const isFreeUser = !user || (user.accountType !== 'admin' && user.accountType !== 'mentor' && user.accountType !== 'student' && user.accountType !== 'pro');

  // Define loadTests function with optimization for specific test types
  const loadTests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Only load tests of the selected type for better performance
      const queryParams = { limit: 1000 };
      if (testTypeFilter === 'practice') {
        queryParams.testType = 'practice';
      } else if (testTypeFilter === 'study-plan') {
        queryParams.testType = 'study-plan';
      }
      
      const response = await testsAPI.getAll(queryParams);
      const testsData = response.data.tests || response.data || [];
      
      // Phase 2: Transform tests progressively
      const transformedTests = testsData.map(test => ({
        id: test._id || test.id,
        title: test.title,
        description: test.description,
        duration: test.totalTime || test.timeLimit || test.duration || 180,
        questions: test.totalQuestions || test.questions || 0,
        difficulty: test.difficulty || 'Medium',
        status: test.isActive ? 'published' : 'draft',
        visible: test.isPublic,
        testType: test.testType || (test.type === 'study-plan' ? 'study-plan' : 'practice'),
        type: test.type || 'custom',
        sections: test.sections || [],
        testDate: test.testDate || null,
        category: test.category || null,
        created: test.createdAt ? new Date(test.createdAt).toISOString().split('T')[0] : new Date().toISOString().toISOString().split('T')[0]
      }));
      
      setTests(transformedTests);
      
      // Phase 3: Load attempt statuses in background (non-blocking)
      if (transformedTests.length > 0 && user?.id) {
                   TestCacheManager.cacheTestList(transformedTests, user.id).catch(error => {
             if (process.env.NODE_ENV === 'development') {
               console.warn('Failed to cache test list:', error);
             }
           });
      }
      
    } catch (error) {
      logger.error('Error loading tests:', error);
      // Your existing localStorage fallback
      try {
        const localTests = JSON.parse(localStorage.getItem('satTests') || '[]');
        setTests(localTests);
      } catch (localError) {
        logger.error('Error loading from localStorage:', localError);
        setTests([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, testTypeFilter]); // Added testTypeFilter dependency

  // useEffect after function definition
  useEffect(() => {
    loadTests();
    
    // Cleanup old cache entries periodically
    const cleanupInterval = setInterval(() => {
      TestCacheManager.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(cleanupInterval);
  }, [loadTests]);

  const getDifficultyColor = (difficulty) => {
    // Handle undefined, null, or empty difficulty
    if (!difficulty || typeof difficulty !== 'string') {
      return 'bg-gray-100 text-gray-800';
    }
    
    switch (difficulty.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
      case 'hard':
        return 'bg-red-100 text-red-800';
      case 'expert':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusPill = (attemptStatus) => {
    if (attemptStatus?.completedAttempts > 0) {
      return { text: 'Completed', cls: 'bg-green-100 text-green-800' };
    }
    if (attemptStatus?.hasIncompleteAttempt) {
      return { text: 'Incomplete', cls: 'bg-yellow-100 text-yellow-800' };
    }
    return { text: 'Not started', cls: 'bg-gray-100 text-gray-600' };
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // eslint-disable-next-line no-unused-vars
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

  // Filter tests based on current filters
  const filteredTests = tests.filter(test => {
    // First filter by test type
    if (testTypeFilter === 'practice') {
      // For real tests, filter by testType field (which should be 'practice' for real tests)
      if (test.testType !== 'practice') {
        return false;
      }
      
      // Apply section filtering to real tests as well
      if (sectionFilter !== 'all') {
        // Check if test has sections that match the filter
        const hasEnglishSection = test.sections && test.sections.some(section => section.type === 'english');
        const hasMathSection = test.sections && test.sections.some(section => section.type === 'math');
        
        if (sectionFilter === 'english' && !hasEnglishSection) return false;
        if (sectionFilter === 'math' && !hasMathSection) return false;
      }
    } else if (testTypeFilter === 'study-plan') {
      // For mock tests, filter by testType field (which should be 'study-plan' for mock tests)
      if (test.testType !== 'study-plan') {
        return false;
      }
      
      if (sectionFilter !== 'all') {
        // Check if test has sections that match the filter
        const hasEnglishSection = test.sections && test.sections.some(section => section.type === 'english');
        const hasMathSection = test.sections && test.sections.some(section => section.type === 'math');
        
        if (sectionFilter === 'english' && !hasEnglishSection) return false;
        if (sectionFilter === 'math' && !hasMathSection) return false;
      }
    }
    
    // Then filter by search term (applies to all test types)
    if (searchTerm && !test.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTests = filteredTests.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of the tests section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToFirstPage = () => handlePageChange(1);
  const goToLastPage = () => handlePageChange(totalPages);
  const goToPreviousPage = () => handlePageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () => handlePageChange(Math.min(totalPages, currentPage + 1));

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [testTypeFilter, searchTerm, sectionFilter]);

  // Prevent free users from accessing mock tests
  useEffect(() => {
    if (isFreeUser && testTypeFilter === 'study-plan') {
      setTestTypeFilter('practice');
    }
  }, [isFreeUser, testTypeFilter]);

  const TestCard = ({ test }) => {
    const [attemptStatus, setAttemptStatus] = useState(null);
    
    useEffect(() => {
      // Use cached attempt status if available
      const cachedStatus = TestCacheManager.getCachedAttemptStatus(test.id, user?.id);
      if (cachedStatus) {
        setAttemptStatus(cachedStatus);
        return;
      }
      
      // Fallback to individual API call if cache miss
      const checkAttemptStatus = async () => {
        try {
          const response = await fetch(`/api/results/attempt-status/${test.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setAttemptStatus(data.data);
            
            // Cache the result
            TestCacheManager.setCachedAttemptStatus(test.id, user?.id, data.data);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Database check failed, using localStorage fallback:', error);
          }
        }
      };
      
      checkAttemptStatus();
    }, [test.id]);
    
    const getButtonState = () => {
      if (attemptStatus) {
        const { canAttempt } = attemptStatus;
        let maxAttempts = attemptStatus.maxAttempts;
        let accountTypeLabel = attemptStatus.accountTypeLabel;
        if (!maxAttempts || !accountTypeLabel) {
          if (user?.accountType === 'admin' || user?.accountType === 'mentor' || user?.accountType === 'student' || user?.accountType === 'pro') {
            maxAttempts = '∞';
            accountTypeLabel = user.accountType === 'admin' ? 'Admin' : user.accountType === 'mentor' ? 'Mentor' : user.accountType === 'student' ? 'Student' : 'Pro';
          } else {
            maxAttempts = 1;
            accountTypeLabel = 'Free';
          }
        }
        return { text: 'Start Test', maxAttempts, accountTypeLabel, canAttempt };
      }
      let maxAttempts = 1;
      let accountType = 'Free';
      if (user?.accountType === 'admin' || user?.accountType === 'mentor' || user?.accountType === 'student' || user?.accountType === 'pro') {
        maxAttempts = '∞';
        accountType = user.accountType === 'admin' ? 'Admin' : user.accountType === 'mentor' ? 'Mentor' : user.accountType === 'student' ? 'Student' : 'Pro';
      }
      return { text: 'Start Test', maxAttempts, accountTypeLabel: accountType, canAttempt: maxAttempts === '∞' || 0 < maxAttempts };
    };
    
    const buttonState = getButtonState();
    
    const statusPill = getStatusPill(attemptStatus);
    return (
      <div className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{test.title}</h3>
            <p className="text-gray-600 text-sm mb-3">{test.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(test.difficulty)}`}>
              {test.difficulty || 'Unknown'}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusPill.cls}`}>
              {statusPill.text}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <FiClock size={14} />
            {formatDuration(test.duration)}
          </span>
          <span className="flex items-center gap-1">
            <FiBookOpen size={14} />
            {test.questions} questions
          </span>
          <span className="text-xs text-gray-500">
            Created: {test.created}
          </span>
          {test.category && (
            <span className="text-xs text-blue-600">
              Test Date: {test.category}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              test.testType === 'study-plan'
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {test.testType === 'study-plan' ? 'Mock Test' : 'Real Test'}
            </span>
          </div>
          
          {true && (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-gray-500 mb-1">
                <span>{buttonState.accountTypeLabel}: {buttonState.maxAttempts === '∞' ? 'Unlimited' : buttonState.maxAttempts} attempts</span>
              </div>
              
              <Link
                to={`/tests/${test.id}`}
                className={`px-6 py-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 min-w-[120px] ${
                  buttonState.canAttempt
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                <FiPlay size={16} />
                {buttonState.text}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Marketing Banner for Free Users */}
      {isFreeUser && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FiStar className="text-yellow-500" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Feeling lost without guidance?</h3>
              </div>
              <p className="text-gray-700 mb-3">
                Struggling with SAT preparation? Lacking structured study plans and comprehensive mock tests? 
                Upgrade to Pro and unlock unlimited access to our complete test bank, personalized study plans, 
                and expert guidance to boost your SAT score!
              </p>
              <Link
                to="/upgrade-plan"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Upgrade to Pro
                <FiArrowRight size={16} />
              </Link>
            </div>
            <div className="hidden md:block ml-6">
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">∞</div>
                <div className="text-sm text-gray-600">Unlimited Tests</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {testTypeFilter === 'practice' ? 'Real Tests' : 'Mock Tests'}
        </h1>
        <p className="text-gray-600">
          {testTypeFilter === 'practice' 
            ? 'Browse and take SAT real tests to simulate actual exam conditions. Filter by section type to focus on specific areas.'
            : 'Browse and take SAT mock tests with focused sections. Filter by section type to focus on specific areas.'
          }
        </p>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col gap-4 mb-6">
        
        {/* Test Type Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FiFilter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Test Type:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTestTypeFilter('practice');
                setSearchTerm('');
                setSectionFilter('all');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                testTypeFilter === 'practice'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Real Tests
            </button>
            {!isFreeUser && (
              <button
                onClick={() => {
                  setTestTypeFilter('study-plan');
                  setSearchTerm('');
                  setSectionFilter('all');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  testTypeFilter === 'study-plan'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Mock Tests
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FiSearch size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Search by name:</span>
          </div>
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search tests by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {(testTypeFilter === 'study-plan' || testTypeFilter === 'practice') && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiFilter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Section Type:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSectionFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sectionFilter === 'all'
                    ? testTypeFilter === 'practice' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Sections
              </button>
              <button
                onClick={() => setSectionFilter('english')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sectionFilter === 'english'
                    ? testTypeFilter === 'practice' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                English Section Only
              </button>
              <button
                onClick={() => setSectionFilter('math')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sectionFilter === 'math'
                    ? testTypeFilter === 'practice' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Math Section Only
              </button>
            </div>
          </div>
        )}
      </div>

      {filteredTests.length === 0 ? (
        <div className="text-center py-12">
          <FiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {testTypeFilter === 'practice' ? 'real' : 'mock'} tests found
            {sectionFilter !== 'all' && (testTypeFilter === 'practice' || testTypeFilter === 'study-plan') 
              ? ` with ${sectionFilter} sections` 
              : ''
            }
          </h3>
          <p className="text-gray-600">
            {testTypeFilter === 'practice' 
              ? sectionFilter !== 'all' 
                ? `No real tests with ${sectionFilter} sections match your current filters.`
                : 'No real tests match your current filters.'
              : sectionFilter !== 'all'
                ? `No mock tests with ${sectionFilter} sections match your current filters.`
                : 'No mock tests match your current filters.'
            }
          </p>
          {isFreeUser && testTypeFilter === 'study-plan' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                Mock tests are available for Pro users. Upgrade your plan to access comprehensive study materials and mock tests.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-8">
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
              
              {/* Page Info */}
              <div className="ml-6 text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTests.length)} of {filteredTests.length} {testTypeFilter === 'practice' ? 'real' : 'mock'} tests
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Tests;
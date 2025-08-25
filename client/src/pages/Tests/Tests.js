import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiClock, FiPlay, FiFilter, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { testsAPI } from '../../services/api';
import logger from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';
import TestCacheManager from '../../utils/testCacheManager';

const Tests = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false); // Loading state for page navigation
  const [testTypeFilter, setTestTypeFilter] = useState('practice'); // Filter by test type: 'practice' or 'study-plan' (mock tests hidden for free users)
  const [searchTerm, setSearchTerm] = useState(''); // Search by test name
  const [sectionFilter, setSectionFilter] = useState('all'); // Filter by section type for mock tests: 'all', 'english', 'math'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // Show 9 tests per page (3x3 grid)
  const [totalTests, setTotalTests] = useState(0); // Total count from server

  // Define loadTests function with pagination
  const loadTests = useCallback(async (page = 1, testType = null) => {
    try {
      setLoading(true);
      
      // Calculate skip for pagination
      const skip = (page - 1) * itemsPerPage;
      
      // Build query parameters
      const queryParams = {
        limit: itemsPerPage,
        page: page,
        skip: skip
      };
      
      // Add test type filter if specified
      if (testType) {
        queryParams.type = testType === 'practice' ? 'practice' : 'study-plan';
      }
      
      // Add section filter
      if (sectionFilter && sectionFilter !== 'all') {
        queryParams.section = sectionFilter;
      }
      
      // Add search term
      if (searchTerm) {
        queryParams.search = searchTerm;
      }
      
      // Load tests with pagination
      const response = await testsAPI.getAll(queryParams);
      const testsData = response.data.tests || response.data || [];
      const totalCount = response.data.total || response.data.count || 0;
      
      // Transform tests progressively
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
      
      // Filter out mock tests for free users
      const filteredTransformedTests = user?.accountType === 'free' 
        ? transformedTests.filter(test => test.testType !== 'study-plan')
        : transformedTests;
      
      // Update tests state based on page
      if (page === 1) {
        // First page - replace all tests
        setTests(filteredTransformedTests);
      } else {
        // Subsequent pages - append to existing tests
        setTests(prev => {
          // Remove any existing tests from this page to avoid duplicates
          const existingTests = prev.filter(test => {
            const testPage = Math.floor(prev.indexOf(test) / itemsPerPage) + 1;
            return testPage !== page;
          });
          return [...existingTests, ...filteredTransformedTests];
        });
      }
      
      // Update pagination state
      setTotalTests(totalCount);
      
      // Cache the tests
      if (filteredTransformedTests.length > 0 && user?.id) {
        TestCacheManager.cacheTestList(filteredTransformedTests, user.id).catch(error => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to cache test list:', error);
          }
        });
      }
      
    } catch (error) {
      logger.error('Error loading tests:', error);
      // Fallback to localStorage for first page only
      if (page === 1) {
        try {
          const localTests = JSON.parse(localStorage.getItem('satTests') || '[]');
          const filteredLocalTests = user?.accountType === 'free' 
            ? localTests.filter(test => test.testType !== 'study-plan')
            : localTests;
          setTests(filteredLocalTests.slice(0, itemsPerPage));
          setTotalTests(filteredLocalTests.length);
        } catch (localError) {
          logger.error('Error loading from localStorage:', localError);
          setTests([]);
          setTotalTests(0);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.accountType, itemsPerPage, sectionFilter, searchTerm]);

  // useEffect after function definition
  useEffect(() => {
    // Load first page of tests initially
    loadTests(1);
    
    // Cleanup old cache entries periodically
    const cleanupInterval = setInterval(() => {
      TestCacheManager.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(cleanupInterval);
  }, [loadTests]);

  // Validate and set filter state
  const setValidTestTypeFilter = useCallback((filter) => {
    // Ensure free users can't access mock tests
    if (user?.accountType === 'free' && filter === 'study-plan') {
      setTestTypeFilter('practice');
      return;
    }
    setTestTypeFilter(filter);
  }, [user?.accountType]);

  // Ensure free users can't access mock tests
  useEffect(() => {
    if (user?.accountType === 'free' && testTypeFilter === 'study-plan') {
      setValidTestTypeFilter('practice');
    }
  }, [user?.accountType, testTypeFilter, setValidTestTypeFilter]);

  // Clear invalid filter states for free users
  useEffect(() => {
    if (user?.accountType === 'free') {
      // Clear any localStorage filter state that might be invalid
      const savedFilter = localStorage.getItem('testTypeFilter');
      if (savedFilter === 'study-plan') {
        localStorage.removeItem('testTypeFilter');
      }
    }
  }, [user?.accountType]);

  // Save filter state to localStorage
  useEffect(() => {
    if ((testTypeFilter && testTypeFilter !== 'study-plan') || user?.accountType !== 'free') {
      localStorage.setItem('testTypeFilter', testTypeFilter);
    }
  }, [testTypeFilter, user?.accountType]);

  // Restore filter state from localStorage on component load
  useEffect(() => {
    if (user) {
      const savedFilter = localStorage.getItem('testTypeFilter');
      if (savedFilter && (savedFilter !== 'study-plan' || user.accountType !== 'free')) {
        setValidTestTypeFilter(savedFilter);
      }
    }
  }, [user, setValidTestTypeFilter]);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  // Pagination calculations
  const { totalPages, startIndex, endIndex, currentTests } = useMemo(() => {
    const totalPages = Math.ceil(totalTests / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTests = tests.slice(startIndex, endIndex);
    
    return { totalPages, startIndex, endIndex, currentTests };
  }, [tests, currentPage, itemsPerPage, totalTests]);

  const handlePageChange = async (page) => {
    setCurrentPage(page);
    
    // Load tests for the new page if not already loaded
    const testsForPage = tests.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    if (testsForPage.length === 0 || testsForPage.some(test => !test)) {
      setPageLoading(true);
      try {
        await loadTests(page);
      } finally {
        setPageLoading(false);
      }
    }
    
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
      // Use database data if available, otherwise fallback to localStorage
      if (attemptStatus) {
        const { hasIncompleteAttempt, canAttempt } = attemptStatus;
        
        // Always ensure we have consistent values for maxAttempts and accountTypeLabel
        let maxAttempts = attemptStatus.maxAttempts;
        let accountTypeLabel = attemptStatus.accountTypeLabel;
        
        // Fallback to localStorage logic if database values are missing
        if (!maxAttempts || !accountTypeLabel) {
          if (user?.accountType === 'admin' || user?.accountType === 'mentor' || user?.accountType === 'student' || user?.accountType === 'pro') {
            maxAttempts = '∞';
            accountTypeLabel = user.accountType === 'admin' ? 'Admin' : user.accountType === 'mentor' ? 'Mentor' : user.accountType === 'student' ? 'Student' : 'Pro';
          } else {
            maxAttempts = 1;
            accountTypeLabel = 'Free';
          }
        }
        
        return {
          text: hasIncompleteAttempt ? 'Continue Test' : 'Start Test',
          maxAttempts,
          accountTypeLabel,
          canAttempt
        };
      }
      
      // Fallback to localStorage logic
      const hasProgress = localStorage.getItem(`test_progress_${test.id}`);
      let maxAttempts = 1;
      let accountType = 'Free';
      
      if (user?.accountType === 'admin' || user?.accountType === 'mentor' || user?.accountType === 'student' || user?.accountType === 'pro') {
        maxAttempts = '∞';
        accountType = user.accountType === 'admin' ? 'Admin' : user.accountType === 'mentor' ? 'Mentor' : user.accountType === 'student' ? 'Student' : 'Pro';
      } else {
        maxAttempts = 1;
        accountType = 'Free';
      }
      
      return {
        text: hasProgress ? 'Continue Test' : 'Start Test',
        maxAttempts,
        accountTypeLabel: accountType,
        canAttempt: maxAttempts === '∞' || 0 < maxAttempts
      };
    };
    
    const buttonState = getButtonState();
    
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
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(test.status)}`}>
              {test.status === 'published' ? 'Published' : 'Draft'}
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
          
          {test.status === 'published' && (
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

  // Check if current test type is loading
  const isCurrentTypeLoading = loading || pageLoading;

  return (
    <div className="space-y-6">
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
                setValidTestTypeFilter('practice');
                setSearchTerm('');
                setSectionFilter('all');
                setCurrentPage(1); // Reset to first page
                loadTests(1); // Load first page of real tests
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                testTypeFilter === 'practice'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Real Tests
            </button>
            {user?.accountType !== 'free' && (
              <button
                onClick={() => {
                  setValidTestTypeFilter('study-plan');
                  setSearchTerm('');
                  setSectionFilter('all');
                  setCurrentPage(1); // Reset to first page
                  loadTests(1, 'study-plan'); // Load first page of mock tests
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
          <div className="flex-1 max-w-md flex gap-2">
            <input
              type="text"
              placeholder="Search tests by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  loadTests(1, testTypeFilter === 'study-plan' ? 'study-plan' : null);
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => loadTests(1, testTypeFilter === 'study-plan' ? 'study-plan' : null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {(testTypeFilter === 'study-plan' && user?.accountType !== 'free') || testTypeFilter === 'practice' ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiFilter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Section Type:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSectionFilter('all');
                  setCurrentPage(1); // Reset to first page
                  loadTests(1, testTypeFilter === 'study-plan' ? 'study-plan' : null);
                }}
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
                onClick={() => {
                  setSectionFilter('english');
                  setCurrentPage(1); // Reset to first page
                  loadTests(1, testTypeFilter === 'study-plan' ? 'study-plan' : null);
                }}
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
                onClick={() => {
                  setSectionFilter('math');
                  setCurrentPage(1); // Reset to first page
                  loadTests(1, testTypeFilter === 'study-plan' ? 'study-plan' : null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sectionFilter === 'math'
                    ? testTypeFilter === 'practice' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Math Section Only
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Loading progress indicator */}
      {(loading || pageLoading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div className="flex-1">
              <p className="text-sm text-blue-700">
                {loading ? 'Loading tests...' : 'Loading page...'}
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tests.length === 0 ? (
        <div className="text-center py-12">
          {isCurrentTypeLoading ? (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading {testTypeFilter === 'practice' ? 'Real' : 'Mock'} Tests...
              </h3>
              <p className="text-gray-600">
                Please wait while we load the {testTypeFilter === 'practice' ? 'real' : 'mock'} tests for you.
              </p>
            </>
          ) : (
            <>
              <FiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {user?.accountType === 'free' && testTypeFilter === 'study-plan' 
                  ? 'Mock Tests Not Available'
                  : `No ${testTypeFilter === 'practice' ? 'real' : 'mock'} tests found`
                }
                {sectionFilter !== 'all' && (testTypeFilter === 'practice' || testTypeFilter === 'study-plan') 
                  ? ` with ${sectionFilter} sections` 
                  : ''
                }
              </h3>
              <p className="text-gray-600">
                {user?.accountType === 'free' && testTypeFilter === 'study-plan'
                  ? 'Mock tests are only available for premium users. Please upgrade your plan to access comprehensive study materials.'
                  : testTypeFilter === 'practice' 
                  ? sectionFilter !== 'all' 
                    ? `No real tests with ${sectionFilter} sections match your current filters.`
                    : 'No real tests match your current filters.'
                  : sectionFilter !== 'all'
                    ? `No mock tests with ${sectionFilter} sections match your current filters.`
                    : 'No mock tests match your current filters.'
                }
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isCurrentTypeLoading ? (
              // Skeleton loading state
              Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-white border rounded-lg p-6 shadow-sm animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : (
              currentTests.map((test) => (
                <TestCard key={test.id} test={test} />
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-8">
              <div className="flex items-center space-x-2">
                {/* First Page Button */}
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1 || pageLoading}
                  className={`p-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 1 || pageLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiChevronLeft className="h-4 w-4" />
                </button>
                
                {/* Previous Page Button */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1 || pageLoading}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === 1 || pageLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mx-auto"></div>
                  ) : (
                    'Previous'
                  )}
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
                        disabled={pageLoading}
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
                  disabled={currentPage === totalPages || pageLoading}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === totalPages || pageLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mx-auto"></div>
                  ) : (
                    'Next'
                  )}
                </button>
                
                {/* Last Page Button */}
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages || pageLoading}
                  className={`p-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === totalPages || pageLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FiChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              {/* Page Info */}
              <div className="ml-6 text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, totalTests)} of {totalTests} tests
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Tests;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiClock, FiPlay, FiFilter, FiSearch } from 'react-icons/fi';
import { testsAPI } from '../../services/api';
import logger from '../../utils/logger';

const Tests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testTypeFilter, setTestTypeFilter] = useState('all'); // Filter by test type: 'all', 'practice', or 'study-plan'
  const [searchTerm, setSearchTerm] = useState(''); // Search by test name
  const [sectionFilter, setSectionFilter] = useState('all'); // Filter by section type for mock tests: 'all', 'english', 'math'

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await testsAPI.getAll();
      const testsData = response.data.tests || response.data || [];
      
      // Transform the data to match our UI format and calculate difficulty
      const transformedTests = await Promise.all(testsData.map(async test => {
        // Calculate test difficulty based on question difficulties
        let calculatedDifficulty = test.difficulty || 'Medium';
        
        try {
          // Fetch questions for this test to calculate difficulty
          const questionsResponse = await testsAPI.getQuestions(test._id || test.id);
          const questions = questionsResponse.data.questions || [];
          
          if (questions.length > 0) {
            // Count difficulties
            const difficultyCounts = {
              easy: 0,
              medium: 0,
              hard: 0
            };
            
            questions.forEach(question => {
              const difficulty = (question.difficulty || 'medium').toLowerCase();
              if (difficultyCounts.hasOwnProperty(difficulty)) {
                difficultyCounts[difficulty]++;
              }
            });
            
            // Determine the most common difficulty
            const maxCount = Math.max(difficultyCounts.easy, difficultyCounts.medium, difficultyCounts.hard);
            
            if (difficultyCounts.hard === maxCount) {
              calculatedDifficulty = 'Hard';
            } else if (difficultyCounts.medium === maxCount) {
              calculatedDifficulty = 'Medium';
            } else {
              calculatedDifficulty = 'Easy';
            }
          }
        } catch (error) {
          logger.error(`Error fetching questions for test ${test._id}:`, error);
          // Keep the original difficulty if we can't fetch questions
        }
        
        // Determine testType based on available fields
        let determinedTestType = test.testType;
        if (!determinedTestType) {
          // If testType is not set, infer from type field
          if (test.type === 'study-plan') {
            determinedTestType = 'study-plan';
          } else if (test.type === 'custom' || test.type === 'full' || test.type === 'math' || test.type === 'reading' || test.type === 'writing') {
            determinedTestType = 'practice';
          } else {
            // Default fallback
            determinedTestType = 'practice';
          }
        }

        return {
          id: test._id || test.id,
          title: test.title,
          description: test.description,
          duration: test.totalTime || test.timeLimit || test.duration || 180,
          questions: test.totalQuestions || test.questions || 0,
          difficulty: calculatedDifficulty || 'Medium', // Ensure difficulty is never undefined
          status: test.isActive ? 'published' : 'draft',
          visible: test.isPublic,
          testType: determinedTestType, // Use determined testType
          type: test.type || 'custom', // Keep original type field
          sections: test.sections || [], // Include sections for filtering
          testDate: test.testDate || null,
          category: test.category || null,
          created: test.createdAt ? new Date(test.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
      }));
      

      setTests(transformedTests);
    } catch (error) {
      logger.error('Error loading tests:', error);
      // Fallback to localStorage if API fails
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
  };

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

  const filteredTests = tests.filter(test => {
    // First filter by test type
    if (testTypeFilter === 'practice') {
      // For real tests, filter by testType field (which should be 'practice' for real tests)
      if (test.testType !== 'practice') {
        return false;
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

  const TestCard = ({ test }) => (
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
          <Link
            to={`/tests/${test.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <FiPlay size={14} />
            {localStorage.getItem(`test_progress_${test.id}`) ? 'Continue Test' : 'Start Test'}
          </Link>
        )}
      </div>
    </div>
  );

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {testTypeFilter === 'all' ? 'All Tests' : testTypeFilter === 'practice' ? 'Real Tests' : 'Mock Tests'}
        </h1>
        <p className="text-gray-600">
          {testTypeFilter === 'all' 
            ? 'Browse and take all available SAT tests to improve your skills.'
            : testTypeFilter === 'practice' 
            ? 'Browse and take SAT real tests to simulate actual exam conditions.'
            : 'Browse and take SAT mock tests with focused sections.'
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
                setTestTypeFilter('all');
                setSearchTerm('');
                setSectionFilter('all');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                testTypeFilter === 'all'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Show All Tests
            </button>
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

        {testTypeFilter === 'study-plan' && (
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
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Sections
              </button>
              <button
                onClick={() => setSectionFilter('english')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sectionFilter === 'english'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                English Section Only
              </button>
              <button
                onClick={() => setSectionFilter('math')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sectionFilter === 'math'
                    ? 'bg-green-100 text-green-700'
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
            No {testTypeFilter === 'all' ? '' : testTypeFilter === 'practice' ? 'real' : 'mock'} tests found
          </h3>
          <p className="text-gray-600">
            {testTypeFilter === 'all' 
              ? 'No tests match your current filters.'
              : testTypeFilter === 'practice' 
              ? 'No real tests match your current filters.'
              : 'No mock tests match your current filters.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tests; 
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiLock, FiClock, FiPlay, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { testsAPI } from '../../services/api';

const StudyPlan = () => {
  const { user } = useAuth();

  // Check if user has access to study plans
  if (user?.accountType === 'free' && user?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Study Plans</h1>
          <p className="text-gray-600">
            Access to study plans requires a student account.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FiLock className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            Study plans are available exclusively for student account holders.
          </p>
          <p className="text-sm text-gray-500">
            Upgrade your account to access personalized study plans and enhanced features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Study Plans</h1>
        <p className="text-gray-600">
          Access your personalized study plans and practice materials.
        </p>
      </div>

      <StudyPlanTests />
    </div>
  );
};

const StudyPlanTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await testsAPI.getAll();
      const testsData = response.data.tests || response.data || [];
      
      // Filter only study plan tests
      const studyPlanTests = testsData.filter(test => test.testType === 'study-plan');
      
      // Transform the data to match our UI format
      const transformedTests = studyPlanTests.map(test => {
        return {
          id: test._id || test.id,
          title: test.title,
          description: test.description,
          duration: test.totalTime || test.timeLimit || test.duration || 180,
          questions: test.totalQuestions || test.questions || 0,
          difficulty: test.difficulty || 'Medium',
          status: test.isActive ? 'published' : 'draft',
          visible: test.isPublic,
          testType: 'study-plan',
          type: test.type || 'custom',
          sections: test.sections || [],
          created: test.createdAt ? new Date(test.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        };
      });

      setTests(transformedTests);
    } catch (error) {
      console.error('Error loading study plan tests:', error);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    return status === 'published' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const filteredTests = tests.filter(test => {
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
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            Study Plan
          </span>
        </div>
        
        {test.status === 'published' && (
          <Link
            to={`/tests/${test.id}`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading study plans...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FiSearch size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Search study plans:</span>
        </div>
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search study plans by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {filteredTests.length === 0 ? (
        <div className="text-center py-12">
          <FiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No study plans found
          </h3>
          <p className="text-gray-600">
            No study plans match your current search criteria.
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

export default StudyPlan; 
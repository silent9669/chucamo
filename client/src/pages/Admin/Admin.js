import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { FiSettings, FiUsers, FiBarChart2, FiBookOpen, FiPlus, FiSave, FiEye, FiClock, FiUpload, FiX, FiEdit, FiTrash2, FiTarget, FiSearch, FiInfo } from 'react-icons/fi';
import { testsAPI, questionsAPI, usersAPI } from '../../services/api';
import KaTeXEditor from '../../components/UI/KaTeXEditor';
import MultipleAnswersEditor from '../../components/UI/MultipleAnswersEditor';
import { toast } from 'react-hot-toast';

// Basic input components
const DirectInput = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    defaultValue={value || ''}
    onBlur={(e) => onChange(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        onChange(e.target.value);
      }
    }}
    placeholder={placeholder}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
);

const DirectTextarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    defaultValue={value || ''}
    onBlur={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
    style={{ minHeight: `${rows * 1.5}rem` }}
  />
);

// Admin sub-components
const AdminDashboard = () => (
  <div className="text-center py-12">
    <FiSettings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
    <p className="text-gray-600 mb-6">
      Manage system settings, users, and content.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <div className="card p-6 text-center">
        <FiUsers className="w-8 h-8 text-primary-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">User Management</h3>
        <p className="text-gray-600 text-sm mb-4">Manage user accounts, roles, and permissions</p>
        <Link to="/admin/users" className="btn-primary btn-sm">Manage Users</Link>
      </div>
      <div className="card p-6 text-center">
        <FiBookOpen className="w-8 h-8 text-primary-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Real Test Management</h3>
        <p className="text-gray-600 text-sm mb-4">Create and manage real tests with date categories</p>
        <Link to="/admin/real-tests" className="btn-primary btn-sm">Manage Real Tests</Link>
      </div>
      <div className="card p-6 text-center">
        <FiBookOpen className="w-8 h-8 text-primary-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Mock Test Management</h3>
        <p className="text-gray-600 text-sm mb-4">Create and manage mock tests for study plans</p>
        <Link to="/admin/mock-tests" className="btn-primary btn-sm">Manage Mock Tests</Link>
      </div>
      <div className="card p-6 text-center">
        <FiTarget className="w-8 h-8 text-primary-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Study Plan Management</h3>
        <p className="text-gray-600 text-sm mb-4">Manage study plan content and materials</p>
        <Link to="/study-plan-management" className="btn-primary btn-sm">Manage Study Plans</Link>
      </div>
      <div className="card p-6 text-center">
        <FiBarChart2 className="w-8 h-8 text-primary-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-2">Analytics</h3>
        <p className="text-gray-600 text-sm mb-4">View system analytics and reports</p>
        <Link to="/admin/analytics" className="btn-primary btn-sm">View Analytics</Link>
      </div>
    </div>
  </div>
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  });
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, searchTerm, roleFilter, accountTypeFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.limit,
        search: searchTerm,
        role: roleFilter,
        accountType: accountTypeFilter
      };

      const response = await usersAPI.getAll(params);
      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        pages: response.data.pagination.pages,
        total: response.data.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await usersAPI.updateUser(userId, updates);
      toast.success('User updated successfully');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await usersAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getAccountTypeBadge = (accountType) => {
    const styles = {
      free: 'bg-gray-100 text-gray-800',
      student: 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[accountType]}`}>
        {accountType.charAt(0).toUpperCase() + accountType.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const styles = {
      student: 'bg-green-100 text-green-800',
      admin: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by email, name, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Types</option>
                <option value="free">Free Account</option>
                <option value="student">Student Account</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setAccountTypeFilter('');
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">All Users ({pagination.total})</h2>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.profilePicture ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={user.profilePicture}
                                alt={user.fullName}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        {user.school && (
                          <div className="text-sm text-gray-500">{user.school}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getAccountTypeBadge(user.accountType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(user.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="card-footer">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.current - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.current * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                  disabled={pagination.current === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                  <select
                    value={editingUser.accountType}
                    onChange={(e) => setEditingUser({ ...editingUser, accountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="free">Free Account</option>
                    <option value="student">Student Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingUser.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.value === 'active' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateUser(editingUser._id, {
                    accountType: editingUser.accountType,
                    role: editingUser.role,
                    isActive: editingUser.isActive
                  })}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Real Test Management Component
const RealTestManagement = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingTest, setEditingTest] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState({
    title: '',
    description: '',
    timeLimit: 180,
    sections: [],
    testType: 'practice'
  });
  const [currentSection, setCurrentSection] = useState({
    type: 'english',
    title: '',
    timeLimit: 65,
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    difficulty: 'medium',
    images: [],
    passage: '',
    answerType: 'multiple-choice',
    writtenAnswer: '',
    acceptableAnswers: []
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await testsAPI.getAll();
      const realTests = response.data.tests.filter(test => 
        test.testType === 'practice' || !test.testType
      ).map(test => ({
        ...test,
        id: test._id || test.id,
        visible: test.isPublic !== undefined ? test.isPublic : true,
        created: test.createdAt ? new Date(test.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
      }));
      setTests(realTests);
    } catch (error) {
      console.error('Error loading tests:', error);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now(),
          url: e.target.result,
          name: file.name
        };
        setCurrentQuestion(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (imageId) => {
    setCurrentQuestion(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const removeOption = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const toggleTestVisibility = async (testId, newVisibility) => {
    try {
      const test = tests.find(t => t.id === testId);
      if (test) {
        const updatePayload = {
          isPublic: newVisibility === 'all',
          visibleTo: newVisibility
        };
        
        const response = await testsAPI.update(testId, updatePayload);
        
        setTests(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, visible: newVisibility === 'all', visibleTo: newVisibility }
            : test
        ));
        
        const visibilityText = {
          'all': 'visible to all users',
          'free': 'visible to free accounts only',
          'student': 'visible to student accounts only'
        };
        
        alert(`Test made ${visibilityText[newVisibility]} successfully!`);
      }
    } catch (error) {
      console.error('Error toggling test visibility:', error);
      alert('Failed to update test visibility. Please try again.');
    }
  };

  const deleteTest = async (testId) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await testsAPI.delete(testId);
        setTests(prev => prev.filter(test => test.id !== testId));
        alert('Test deleted successfully!');
      } catch (error) {
        console.error('Error deleting test:', error);
        alert('Failed to delete test. Please try again.');
      }
    }
  };

  const editTest = async (test) => {
    setEditingTest(test);
    
    console.log('=== EDITING TEST ===');
    console.log('Original test data:', test);
    console.log('Test sections:', test.sections);
    
    // Transform sections from API format to client format
    const transformedSections = (test.sections || []).map(section => {
      console.log('Processing section:', section);
      console.log('Section questions:', section.questions);
      
      return {
        id: section._id || section.id || Date.now(),
        title: section.name || section.title || '',
        description: section.instructions || section.description || '',
        timeLimit: section.type === 'math' ? 35 : 32, // Fixed time limits
        type: section.type || 'english',
        questions: section.questions || []
      };
    });
    
    console.log('Transformed sections:', transformedSections);
    console.log('Total questions loaded:', transformedSections.reduce((total, section) => total + section.questions.length, 0));
    
    const currentTestData = {
      id: test.id,
      title: test.title,
      description: test.description,
      timeLimit: transformedSections.reduce((total, section) => total + section.timeLimit, 0), // Sum of section times
      sections: transformedSections,
      testType: 'practice'
    };
    
    console.log('Setting current test data:', currentTestData);
    setCurrentTest(currentTestData);
    setCurrentView('test-builder');
  };

  const saveTest = async () => {
    try {
      setSaving(true);
      
      if (!currentTest.title.trim()) {
        alert('Test title is required');
        return;
      }

      // Debug: Log the current test state before saving
      console.log('=== SAVING TEST ===');
      console.log('Current test sections:', currentTest.sections);
      console.log('Sections with questions:', currentTest.sections?.map(s => ({
        title: s.title,
        questionCount: s.questions?.length || 0,
        questions: s.questions?.map(q => ({
          id: q.id,
          question: q.question?.substring(0, 50) + '...',
          type: q.type,
          answerType: q.answerType,
          hasKaTeX: q.question?.includes('$') || false
        }))
      })));

      // Preserve ALL sections and their questions, even if empty
      const transformedSections = (currentTest.sections || []).map(section => ({
        name: section.title,
        type: section.type || 'english',
        timeLimit: section.type === 'math' ? 35 : 32, // Fixed time limits
        questionCount: section.questions ? section.questions.length : 0,
        instructions: section.description || 'Complete all questions in this section.',
        questions: (section.questions || []).map(question => ({
          ...question,
          // Explicitly preserve the topic field
          topic: question.topic || 'general',
          // Ensure correctAnswer is always a string as required by the schema
          correctAnswer: question.answerType === 'written' 
            ? (question.writtenAnswer || question.correctAnswer || '').toString()
            : (question.correctAnswer || 0).toString(),
          // Ensure type and answerType are properly set
          type: question.type || (question.answerType === 'written' ? 'grid-in' : 'multiple-choice'),
          answerType: question.answerType || (question.type === 'grid-in' ? 'written' : 'multiple-choice')
        }))
      }));

      console.log('Transformed sections:', transformedSections);
      console.log('Total questions across all sections:', transformedSections.reduce((total, section) => total + section.questions.length, 0));

      const description = currentTest.description || 'A comprehensive test for students to practice and improve their skills.';
      if (description.length < 10) {
        alert('Description must be at least 10 characters long. Please provide a more detailed description.');
        return;
      }

      const totalTime = transformedSections.reduce((total, section) => total + section.timeLimit, 0);
      const totalQuestions = transformedSections.reduce((total, section) => total + section.questions.length, 0);

      const testData = {
        title: currentTest.title.trim(),
        description: description,
        type: 'custom',
        testType: 'practice',
        difficulty: 'medium',
        sections: transformedSections,
        totalTime: totalTime,
        totalQuestions: totalQuestions
      };

      console.log('Final test data to save:', testData);
      console.log('Question types in final data:', testData.sections?.map(s => ({
        section: s.name,
        questions: s.questions?.map(q => ({
          id: q.id,
          type: q.type,
          answerType: q.answerType,
          correctAnswer: q.correctAnswer,
          hasOptions: q.options && q.options.length > 0
        }))
      })));

      // Log the exact data being sent to the server
      console.log('=== DATA BEING SENT TO SERVER ===');
      console.log('Raw test data:', JSON.stringify(testData, null, 2));

      let response;
      if (editingTest) {
        response = await testsAPI.update(editingTest.id, testData);
        const updatedTest = {
          ...response.data.test,
          id: response.data.test._id || response.data.test.id,
          testType: 'practice',
          visible: response.data.test.isPublic !== undefined ? response.data.test.isPublic : true,
          created: response.data.test.createdAt ? new Date(response.data.test.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
        };
        setTests(prev => prev.map(test => test.id === editingTest.id ? updatedTest : test));
        setCurrentTest(prev => ({
          ...prev,
          id: updatedTest.id,
          _id: updatedTest._id
        }));
      } else {
        response = await testsAPI.create(testData);
        const newTest = {
          ...response.data.test,
          id: response.data.test._id || response.data.test.id,
          testType: 'practice',
          visible: response.data.test.isPublic !== undefined ? response.data.test.isPublic : true,
          created: response.data.test.createdAt ? new Date(response.data.test.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
        };
        setTests(prev => [...prev, newTest]);
      }

      console.log('Test saved successfully:', response.data);
      
      // Verify that question types are preserved in the saved test
      if (response.data.test && response.data.test.sections) {
        console.log('=== VERIFICATION: SAVED TEST DATA ===');
        console.log('Question types in saved test:', response.data.test.sections?.map(s => ({
          section: s.name,
          questions: s.questions?.map(q => ({
            id: q.id,
            type: q.type,
            answerType: q.answerType
          }))
        })));
      }

      alert(editingTest ? 'Test updated successfully!' : 'Test created successfully!');
      
      if (!editingTest) {
        setCurrentTest({
          title: '',
          description: '',
          timeLimit: 0,
          sections: [],
          testType: 'practice'
        });
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Failed to save test. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Enhanced question saving with KaTeX preservation
  const saveQuestion = async () => {
    try {
      if (!currentQuestion.question.trim()) {
        alert('Question text is required');
        return;
      }

      // Deep clone the current question to preserve all data
      const questionToSave = JSON.parse(JSON.stringify({
        id: editingQuestion ? editingQuestion.id : Date.now(),
        question: currentQuestion.question,
        content: currentQuestion.question,
        topic: currentQuestion.topic || 'general', // This is the question type (e.g., "Information & Ideas", "Algebra")
        difficulty: currentQuestion.difficulty || 'medium',
        explanation: currentQuestion.explanation || '',
        passage: currentQuestion.passage || '',
        type: currentQuestion.answerType === 'written' ? 'grid-in' : 'multiple-choice', // This is the answer type
        options: currentQuestion.answerType === 'multiple-choice' 
          ? currentQuestion.options.map((opt, index) => ({
              content: opt || '',
              isCorrect: index === currentQuestion.correctAnswer
            }))
          : [],
        correctAnswer: currentQuestion.answerType === 'written' 
          ? currentQuestion.writtenAnswer || ''
          : (currentQuestion.options && currentQuestion.options[currentQuestion.correctAnswer]) || '',
        images: (currentQuestion.images || []).map(img => ({
          url: img.url,
          name: img.name
        })),
        answerType: currentQuestion.answerType, // This is the answer type (multiple-choice or written)
        writtenAnswer: currentQuestion.writtenAnswer || '',
        acceptableAnswers: currentQuestion.acceptableAnswers || []
      }));

      // Ensure question type (topic) is properly preserved when editing
      if (editingQuestion) {
        // When editing, preserve the original question topic if it exists
        questionToSave.topic = editingQuestion.topic || currentQuestion.topic || 'general';
        // Keep the answer type as set by the user
        questionToSave.answerType = currentQuestion.answerType;
        // Set the type based on answer type
        questionToSave.type = currentQuestion.answerType === 'written' ? 'grid-in' : 'multiple-choice';
      }

      // Debug logging to verify the separation
      console.log('=== SAVING QUESTION (FIXED) ===');
      console.log('Original question type (topic):', editingQuestion?.topic || currentQuestion.topic || 'general');
      console.log('Original answer type:', editingQuestion?.answerType || currentQuestion.answerType);
      console.log('Saved question type (topic):', questionToSave.topic);
      console.log('Saved answer type:', questionToSave.answerType);
      console.log('Saved type field:', questionToSave.type);

      // Debug: Log the question data being saved
      console.log('=== SAVING QUESTION ===');
      console.log('Question text:', questionToSave.question);
      console.log('Has KaTeX in question:', questionToSave.question?.includes('$'));
      console.log('Explanation:', questionToSave.explanation);
      console.log('Has KaTeX in explanation:', questionToSave.explanation?.includes('$'));
      console.log('Passage:', questionToSave.passage);
      console.log('Has KaTeX in passage:', questionToSave.passage?.includes('$'));
      console.log('Options:', questionToSave.options);
      console.log('Options with KaTeX:', questionToSave.options?.map(opt => opt.content?.includes('$')));

      // Create a new questions array with the updated question
      const updatedQuestions = editingQuestion
        ? currentSection.questions.map(q => q.id === editingQuestion.id ? questionToSave : q)
        : [...currentSection.questions, questionToSave];

      // Create updated section
      const updatedSection = {
        ...currentSection,
        questions: updatedQuestions
      };

      // Update the test state first
      setCurrentTest(prev => {
        const newTest = {
          ...prev,
          sections: prev.sections.map(section => 
            section.id === currentSection.id ? updatedSection : section
          )
        };
        
        console.log('=== UPDATED TEST STATE ===');
        console.log('Test sections count:', newTest.sections.length);
        console.log('Current section questions count:', updatedSection.questions.length);
        
        return newTest;
      });

      // Update the section state
      setCurrentSection(updatedSection);

      // Verify the data was saved correctly
      setTimeout(() => {
        console.log('=== VERIFICATION ===');
        console.log('Current section questions after save:', currentSection.questions?.length);
        console.log('Last question saved:', updatedQuestions[updatedQuestions.length - 1]);
      }, 100);

      alert(editingQuestion ? 'Question updated successfully!' : 'Question created successfully!');
      setEditingQuestion(null);
      setCurrentView('section-builder');
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  const saveSection = () => {
    if (!currentSection.title.trim()) {
      alert('Section title is required');
      return;
    }

    const sectionData = {
      title: currentSection.title,
      timeLimit: currentSection.type === 'math' ? 35 : 32, // Fixed time limits
      type: currentSection.type || 'english',
      questions: currentSection.questions
    };

    if (editingSection) {
      setCurrentTest(prev => ({
        ...prev,
        sections: prev.sections.map(s => s.id === editingSection.id ? { ...s, ...sectionData } : s)
      }));
    } else {
      const newSection = {
        id: Date.now(),
        ...sectionData
      };
      setCurrentTest(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    }

    setEditingSection(null);
    setCurrentSection({
      type: 'english',
      title: '',
      timeLimit: 32,
      questions: []
    });
    setCurrentView('test-builder');
  };

  const deleteQuestion = (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      // Create updated section without the deleted question
      const updatedSection = {
        ...currentSection,
        questions: currentSection.questions.filter(q => q.id !== questionId)
      };

      // Update the current test
      setCurrentTest(prev => {
        const updatedSections = prev.sections.map(section => 
          section.id === currentSection.id ? updatedSection : section
        );
        
        return {
          ...prev,
          sections: updatedSections
        };
      });

      // Update current section state
      setCurrentSection(updatedSection);
    }
  };

  const deleteSection = (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      setCurrentTest(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s.id !== sectionId)
      }));
    }
  };

  // Enhanced state synchronization to prevent data loss
  const syncSectionState = (sectionId) => {
    setCurrentTest(prev => {
      const section = prev.sections.find(s => s.id === sectionId);
      if (section && JSON.stringify(section) !== JSON.stringify(currentSection)) {
        console.log('Syncing section state:', section.title);
        setCurrentSection(section);
      }
      return prev;
    });
  };

  // Enhanced question loading with KaTeX preservation
  const loadQuestionForEditing = (question) => {
    console.log('=== LOADING QUESTION FOR EDITING ===');
    console.log('Original question data:', question);
    
    // Determine the correct answer type and value
    let correctAnswer = 0;
    let writtenAnswer = '';
    
    if (question.type === 'grid-in' || question.answerType === 'written') {
      // For written/grid-in questions, use the writtenAnswer or correctAnswer as string
      writtenAnswer = question.writtenAnswer || question.correctAnswer || '';
    } else {
      // For multiple choice questions, find the correct option index
      if (question.options && question.options.length > 0) {
        const correctOptionIndex = question.options.findIndex(opt => {
          if (typeof opt === 'string') {
            return opt === question.correctAnswer;
          } else {
            return opt.isCorrect === true || opt.content === question.correctAnswer;
          }
        });
        correctAnswer = correctOptionIndex >= 0 ? correctOptionIndex : 0;
      }
    }
    
    const questionData = {
      id: question.id,
      question: question.question || question.content || '',
      topic: question.topic || 'general', // Add topic loading
      options: question.options && question.options.length > 0 
        ? question.options.map(opt => typeof opt === 'string' ? opt : opt.content || '')
        : ['', '', '', ''],
      correctAnswer: correctAnswer,
      explanation: question.explanation || '',
      difficulty: question.difficulty || 'medium',
      images: question.images || [],
      passage: question.passage || '',
      answerType: question.type === 'grid-in' ? 'written' : 'multiple-choice',
      writtenAnswer: writtenAnswer,
      acceptableAnswers: question.acceptableAnswers || []
    };

    console.log('Processed question data:', questionData);
    console.log('KaTeX content preserved:', {
      question: questionData.question?.includes('$'),
      explanation: questionData.explanation?.includes('$'),
      passage: questionData.passage?.includes('$'),
      options: questionData.options?.map(opt => opt.includes('$'))
    });

    setCurrentQuestion(questionData);
    setEditingQuestion(question);
  };

  // Test function to verify data preservation
  const testDataPreservation = () => {
    console.log('=== TESTING DATA PRESERVATION ===');
    
    // Create a test question with KaTeX content
    const testQuestion = {
      id: Date.now(),
      question: 'What is the value of $x^2 + y^2$ when $x = 3$ and $y = 4$?',
      content: 'What is the value of $x^2 + y^2$ when $x = 3$ and $y = 4$?',
      topic: 'general',
      difficulty: 'medium',
      explanation: 'Using the formula $x^2 + y^2 = 3^2 + 4^2 = 9 + 16 = 25$',
      passage: '',
      type: 'multiple-choice',
      options: [
        { content: '$20$', isCorrect: false },
        { content: '$25$', isCorrect: true },
        { content: '$30$', isCorrect: false },
        { content: '$35$', isCorrect: false }
      ],
      correctAnswer: '$25$',
      images: [],
      answerType: 'multiple-choice',
      writtenAnswer: '',
      acceptableAnswers: []
    };

    console.log('Test question created:', testQuestion);
    console.log('KaTeX content in question:', testQuestion.question.includes('$'));
    console.log('KaTeX content in explanation:', testQuestion.explanation.includes('$'));

    // Add the test question to the current section
    if (currentSection) {
      const updatedQuestions = [...(currentSection.questions || []), testQuestion];
      const updatedSection = {
        ...currentSection,
        questions: updatedQuestions
      };

      console.log('Adding test question to section:', updatedSection.title);
      console.log('Section now has', updatedQuestions.length, 'questions');

      // Update both test and section states
      setCurrentTest(prev => ({
        ...prev,
        sections: prev.sections.map(section => 
          section.id === currentSection.id ? updatedSection : section
        )
      }));

      setCurrentSection(updatedSection);

      alert('Test question added! Check console for verification.');
    } else {
      alert('No current section selected. Please create a section first.');
    }
  };

  // Function to ensure question types are properly preserved
  const ensureQuestionTypePreservation = (question) => {
    // Ensure both type and answerType are properly set
    const preservedQuestion = {
      ...question,
      type: question.type || (question.answerType === 'written' ? 'grid-in' : 'multiple-choice'),
      answerType: question.answerType || (question.type === 'grid-in' ? 'written' : 'multiple-choice')
    };
    
    console.log('=== QUESTION TYPE PRESERVATION ===');
    console.log('Original question type (topic):', question.topic || 'general');
    console.log('Original answer type:', question.answerType);
    console.log('Preserved question type (topic):', preservedQuestion.topic);
    console.log('Preserved answer type:', preservedQuestion.answerType);
    
    return preservedQuestion;
  };

  // Function to create complete question data with all fields preserved
  const createCompleteQuestionData = (currentQuestion, editingQuestion) => {
    const questionData = {
      id: editingQuestion ? editingQuestion.id : Date.now(),
      question: currentQuestion.question,
      content: currentQuestion.question,
      topic: currentQuestion.topic || 'general',
      difficulty: currentQuestion.difficulty || 'medium',
      explanation: currentQuestion.explanation || '',
      passage: currentQuestion.passage || '',
      // Preserve the original question type, don't override it
      type: currentQuestion.type || (currentQuestion.answerType === 'written' ? 'grid-in' : 'multiple-choice'),
      options: currentQuestion.answerType === 'multiple-choice' 
        ? currentQuestion.options.map((opt, index) => ({
            content: opt || '',
            isCorrect: index === currentQuestion.correctAnswer
          }))
        : [],
      correctAnswer: currentQuestion.answerType === 'written' 
        ? currentQuestion.writtenAnswer || ''
        : currentQuestion.correctAnswer,
      images: (currentQuestion.images || []).map(img => ({
        url: img.url,
        name: img.name
      })),
      answerType: currentQuestion.answerType,
      writtenAnswer: currentQuestion.writtenAnswer || '',
      acceptableAnswers: currentQuestion.acceptableAnswers || []
    };

    // Ensure question types are properly preserved
    const preservedQuestion = ensureQuestionTypePreservation(questionData);
    
    console.log('=== COMPLETE QUESTION DATA CREATED ===');
    console.log('Question ID:', preservedQuestion.id);
    console.log('Question type (topic):', preservedQuestion.topic);
    console.log('Answer type:', preservedQuestion.answerType);
    console.log('Question text:', preservedQuestion.question?.substring(0, 50) + '...');
    console.log('Options count:', preservedQuestion.options?.length || 0);
    console.log('Has written answer:', !!preservedQuestion.writtenAnswer);
    console.log('Acceptable answers:', preservedQuestion.acceptableAnswers);
    
    return preservedQuestion;
  };



  // Enhanced saveQuestion function that ensures all question data is preserved
  const saveQuestionEnhanced = async (currentQuestion, editingQuestion, currentSection, setCurrentTest, setCurrentSection, setEditingQuestion, setCurrentView) => {
    try {
      if (!currentQuestion.question.trim()) {
        alert('Question text is required');
        return;
      }

      // Create complete question data with all fields preserved
      const questionToSave = createCompleteQuestionData(currentQuestion, editingQuestion);

      // Create a new questions array with the updated question
      const updatedQuestions = editingQuestion
        ? currentSection.questions.map(q => q.id === editingQuestion.id ? questionToSave : q)
        : [...currentSection.questions, questionToSave];

      // Create updated section
      const updatedSection = {
        ...currentSection,
        questions: updatedQuestions
      };

      // Update the test state first
      setCurrentTest(prev => {
        const newTest = {
          ...prev,
          sections: prev.sections.map(section => 
            section.id === currentSection.id ? updatedSection : section
          )
        };
        
        console.log('=== UPDATED TEST STATE ===');
        console.log('Test sections count:', newTest.sections.length);
        console.log('Current section questions count:', updatedSection.questions.length);
        console.log('Question types in updated section:', updatedSection.questions.map(q => ({
          id: q.id,
          type: q.type,
          answerType: q.answerType
        })));
        
        return newTest;
      });

      // Update the section state
      setCurrentSection(updatedSection);

      // Verify the data was saved correctly
      setTimeout(() => {
        console.log('=== VERIFICATION ===');
        console.log('Current section questions after save:', currentSection.questions?.length);
        console.log('Last question saved:', updatedQuestions[updatedQuestions.length - 1]);
        console.log('Question types after save:', updatedQuestions.map(q => ({
          id: q.id,
          type: q.type,
          answerType: q.answerType
        })));
      }, 100);

      alert(editingQuestion ? 'Question updated successfully!' : 'Question created successfully!');
      setEditingQuestion(null);
      setCurrentView('section-builder');
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  // Fixed saveQuestion function that properly preserves question types
  const saveQuestionFixed = async () => {
    try {
      if (!currentQuestion.question.trim()) {
        alert('Question text is required');
        return;
      }

      // Create question data with proper type preservation
      const questionToSave = {
        id: editingQuestion ? editingQuestion.id : Date.now(),
        question: currentQuestion.question,
        content: currentQuestion.question,
        topic: editingQuestion ? (editingQuestion.topic || currentQuestion.topic || 'general') : (currentQuestion.topic || 'general'),
        difficulty: currentQuestion.difficulty || 'medium',
        explanation: currentQuestion.explanation || '',
        passage: currentQuestion.passage || '',
        // CRITICAL: Preserve the original question type, don't override it
        type: currentQuestion.type || (currentQuestion.answerType === 'written' ? 'grid-in' : 'multiple-choice'),
        options: currentQuestion.answerType === 'multiple-choice' 
          ? currentQuestion.options.map((opt, index) => ({
              content: opt || '',
              isCorrect: index === currentQuestion.correctAnswer
            }))
          : [],
        correctAnswer: currentQuestion.answerType === 'written' 
          ? currentQuestion.writtenAnswer || ''
          : currentQuestion.correctAnswer,
        images: (currentQuestion.images || []).map(img => ({
          url: img.url,
          name: img.name
        })),
        answerType: currentQuestion.answerType,
        writtenAnswer: currentQuestion.writtenAnswer || '',
        acceptableAnswers: currentQuestion.acceptableAnswers || []
      };

      // Ensure the question type is properly set based on answerType if not already set
      if (!questionToSave.type) {
        questionToSave.type = questionToSave.answerType === 'written' ? 'grid-in' : 'multiple-choice';
      }

      // Additional validation: ensure type and answerType are consistent
      if (questionToSave.answerType === 'written' && questionToSave.type !== 'grid-in') {
        questionToSave.type = 'grid-in';
      } else if (questionToSave.answerType === 'multiple-choice' && questionToSave.type !== 'multiple-choice') {
        questionToSave.type = 'multiple-choice';
      }

      // Debug: Log the question data being saved
      console.log('=== SAVING QUESTION (FIXED) ===');
      console.log('Original question type (topic):', currentQuestion.topic || 'general');
      console.log('Original answer type:', currentQuestion.answerType);
      console.log('Saved question type (topic):', questionToSave.topic);
      console.log('Saved answer type:', questionToSave.answerType);
      console.log('Question text:', questionToSave.question);
      console.log('Correct answer:', questionToSave.correctAnswer);
      console.log('Written answer:', questionToSave.writtenAnswer);
      console.log('Acceptable answers:', questionToSave.acceptableAnswers);

      // Create a new questions array with the updated question
      const updatedQuestions = editingQuestion
        ? currentSection.questions.map(q => q.id === editingQuestion.id ? questionToSave : q)
        : [...currentSection.questions, questionToSave];

      // Create updated section
      const updatedSection = {
        ...currentSection,
        questions: updatedQuestions
      };

      // Update the test state first
      setCurrentTest(prev => {
        const newTest = {
          ...prev,
          sections: prev.sections.map(section => 
            section.id === currentSection.id ? updatedSection : section
          )
        };
        
        console.log('=== UPDATED TEST STATE ===');
        console.log('Test sections count:', newTest.sections.length);
        console.log('Current section questions count:', updatedSection.questions.length);
        console.log('Question types in updated section:', updatedSection.questions.map(q => ({
          id: q.id,
          type: q.type,
          answerType: q.answerType
        })));
        
        return newTest;
      });

      // Update the section state
      setCurrentSection(updatedSection);

      // Verify the data was saved correctly
      setTimeout(() => {
        console.log('=== VERIFICATION ===');
        console.log('Current section questions after save:', currentSection.questions?.length);
        console.log('Last question saved:', updatedQuestions[updatedQuestions.length - 1]);
        console.log('Question types after save:', updatedQuestions.map(q => ({
          id: q.id,
          type: q.type,
          answerType: q.answerType
        })));
      }, 100);

      alert(editingQuestion ? 'Question updated successfully!' : 'Question created successfully!');
      setEditingQuestion(null);
      setCurrentView('section-builder');
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  // Monitor currentTest state changes to track data preservation
  useEffect(() => {
    console.log('=== CURRENT TEST STATE CHANGED ===');
    console.log('Current test:', currentTest);
    console.log('Sections count:', currentTest.sections?.length || 0);
    if (currentTest.sections) {
      currentTest.sections.forEach((section, index) => {
        console.log(`Section ${index + 1} (${section.title}):`, {
          questionCount: section.questions?.length || 0,
          questions: section.questions?.map(q => ({
            id: q.id,
            type: q.type,
            answerType: q.answerType,
            question: q.question?.substring(0, 30) + '...',
            hasKaTeX: q.question?.includes('$') || false
          }))
        });
      });
    }

    // Save to localStorage to prevent data loss when switching pages
    if (currentTest && currentTest.sections && currentTest.sections.length > 0) {
      localStorage.setItem('currentTestState', JSON.stringify(currentTest));
      console.log('=== SAVED TEST STATE TO LOCALSTORAGE ===');
    }
  }, [currentTest]);

  // Load test state from localStorage on component mount
  useEffect(() => {
    const savedTestState = localStorage.getItem('currentTestState');
    if (savedTestState) {
      try {
        const parsedState = JSON.parse(savedTestState);
        setCurrentTest(parsedState);
        console.log('=== LOADED TEST STATE FROM LOCALSTORAGE ===');
        console.log('Loaded test sections:', parsedState.sections?.length || 0);
        console.log('Loaded questions:', parsedState.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) || 0);
      } catch (error) {
        console.error('Error loading test state from localStorage:', error);
      }
    }
  }, []);

  // Ensure question type is always set when answerType changes
  useEffect(() => {
    if (currentQuestion.answerType && !currentQuestion.type) {
      setCurrentQuestion(prev => ({
        ...prev,
        type: prev.answerType === 'written' ? 'grid-in' : 'multiple-choice'
      }));
      console.log('=== AUTO-SETTING QUESTION TYPE ===');
      console.log('Answer type:', currentQuestion.answerType);
      console.log('Setting type to:', currentQuestion.answerType === 'written' ? 'grid-in' : 'multiple-choice');
    }
  }, [currentQuestion.answerType, currentQuestion.type]);

  // Test function to verify server data preservation and question types
  const testServerDataPreservation = async () => {
    try {
      console.log('=== TESTING SERVER DATA PRESERVATION ===');
      
      // Get the current test ID
      if (!currentTest.id) {
        alert('No test selected. Please create or edit a test first.');
        return;
      }

      // First, let's check what's in the current client state
      console.log('=== CLIENT STATE CHECK ===');
      if (currentTest.sections && currentTest.sections.length > 0) {
        currentTest.sections.forEach((section, sectionIndex) => {
          if (section.questions && section.questions.length > 0) {
            console.log(`Client Section ${sectionIndex + 1} (${section.title}) questions:`);
            section.questions.forEach((question, questionIndex) => {
              console.log(`  Client Question ${questionIndex + 1}:`, {
                id: question.id,
                type: question.type,
                answerType: question.answerType,
                correctAnswer: question.correctAnswer,
                hasOptions: question.options && question.options.length > 0,
                optionsCount: question.options ? question.options.length : 0
              });
            });
          }
        });
      }

      // Call the debug endpoint
      const response = await fetch(`/api/tests/${currentTest.id}/debug`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Server debug data:', data);

      if (data.success && data.debug) {
        console.log('Test ID:', data.debug.testId);
        console.log('Title:', data.debug.title);
        console.log('Sections count:', data.debug.sectionsCount);
        
        let totalQuestions = 0;
        let questionsWithTypes = 0;
        let questionsWithCorrectAnswers = 0;
        
        data.debug.sections.forEach((section, index) => {
          console.log(`Section ${index + 1} (${section.name}):`, {
            type: section.type,
            timeLimit: section.timeLimit,
            questionCount: section.questionCount,
            questionsCount: section.questionsCount,
            questions: section.questions
          });

          // Check each question for types and correct answers
          if (section.questions && section.questions.length > 0) {
            section.questions.forEach((question, qIndex) => {
              totalQuestions++;
              
              console.log(`Question ${qIndex + 1}:`, {
                id: question.id,
                type: question.type,
                answerType: question.answerType,
                correctAnswer: question.correctAnswer,
                hasOptions: question.options && question.options.length > 0,
                optionsCount: question.options ? question.options.length : 0
              });

              // Check if question has proper type
              if (question.type && (question.type === 'multiple-choice' || question.type === 'grid-in')) {
                questionsWithTypes++;
              }

              // Check if question has correct answer
              if (question.correctAnswer !== undefined && question.correctAnswer !== null && question.correctAnswer !== '') {
                questionsWithCorrectAnswers++;
              }
            });
          }
        });

        console.log('=== DATA PRESERVATION SUMMARY ===');
        console.log('Total questions:', totalQuestions);
        console.log('Questions with proper types:', questionsWithTypes);
        console.log('Questions with correct answers:', questionsWithCorrectAnswers);
        console.log('Type preservation rate:', totalQuestions > 0 ? `${(questionsWithTypes / totalQuestions * 100).toFixed(1)}%` : 'N/A');
        console.log('Correct answer preservation rate:', totalQuestions > 0 ? `${(questionsWithCorrectAnswers / totalQuestions * 100).toFixed(1)}%` : 'N/A');
        
        if (totalQuestions > 0) {
          const typeRate = (questionsWithTypes / totalQuestions * 100).toFixed(1);
          const answerRate = (questionsWithCorrectAnswers / totalQuestions * 100).toFixed(1);
          alert(`✅ Data Analysis Complete!\n\nTotal Questions: ${totalQuestions}\nQuestions with Types: ${questionsWithTypes} (${typeRate}%)\nQuestions with Correct Answers: ${questionsWithCorrectAnswers} (${answerRate}%)\n\nCheck console for detailed breakdown.`);
        } else {
          alert('❌ No questions found in database. Data loss detected!');
        }
      }
    } catch (error) {
      console.error('Error testing server data preservation:', error);
      alert('Error testing server data preservation: ' + error.message);
    }
  };

  const RealTestDashboard = () => {
    // Add search functionality for real tests
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTests, setFilteredTests] = useState([]);

    // Filter tests based on search term
    useEffect(() => {
      if (searchTerm.trim() === '') {
        setFilteredTests(tests);
      } else {
        const filtered = tests.filter(test => 
          test.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTests(filtered);
      }
    }, [searchTerm, tests]);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Real Test Management</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search tests by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              onClick={() => {
                setCurrentTest({ title: '', description: '', timeLimit: 180, sections: [], testType: 'practice' });
                setCurrentView('test-builder');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <FiPlus size={20} />
              Create Real Test
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tests...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12">
            <FiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No tests found matching your search' : 'No real tests found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms.' : 'Create your first real test to get started.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setCurrentTest({ title: '', description: '', timeLimit: 180, sections: [], testType: 'practice' });
                  setCurrentView('test-builder');
                }}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white"
              >
                Create Your First Real Test
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTests.map(test => (
              <div key={test.id} className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiClock size={16} />
                        {test.duration || test.totalTime || 0} minutes
                      </span>
                      <span>{test.questions || test.totalQuestions || 0} questions</span>
                      <span>{Array.isArray(test.sections) ? test.sections.length : 0} sections</span>
                      <span className="text-xs">{test.created}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Real Test
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      test.visibleTo === 'all' 
                        ? 'bg-green-100 text-green-800'
                        : test.visibleTo === 'student'
                        ? 'bg-blue-100 text-blue-800'
                        : test.visibleTo === 'free'
                        ? 'bg-yellow-100 text-yellow-800'
                        : test.visible
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {test.visibleTo === 'all' ? 'All Users' :
                       test.visibleTo === 'student' ? 'Student Only' :
                       test.visibleTo === 'free' ? 'Free Only' :
                       test.visible ? 'Visible' : 'Hidden'}
                    </span>
                    <button 
                      onClick={() => editTest(test)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Edit Test"
                    >
                      <FiEdit size={16} />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => {
                          const visibility = test.visibleTo === 'all' ? 'free' : 
                                           test.visibleTo === 'free' ? 'student' : 'all';
                          toggleTestVisibility(test.id, visibility);
                        }}
                        className={`p-2 ${test.visibleTo === 'all' ? 'text-green-600' : 
                                         test.visibleTo === 'student' ? 'text-blue-600' : 
                                         test.visibleTo === 'free' ? 'text-yellow-600' : 
                                         test.visible ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600`}
                        title="Change Visibility"
                      >
                        <FiEye size={16} />
                      </button>
                    </div>
                    <button 
                      onClick={() => deleteTest(test.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete Test"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const RealTestBuilder = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingTest ? 'Edit Real Test' : 'Create Real Test'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingTest(null);
              setCurrentTest({
                title: '',
                description: '',
                timeLimit: 0,
                sections: [],
                testType: 'practice'
              });
              setCurrentView('dashboard');
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={saveTest}
            disabled={saving || !currentTest.title.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : (editingTest ? 'Update Test' : 'Create Test')}
          </button>
          {editingTest && (
            <button
              onClick={testServerDataPreservation}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              title="Test Server Data Preservation"
            >
              Test Server Data
            </button>
          )}
          {editingTest && (
            <button
              onClick={() => {
                console.log('=== SERVER DATA VERIFICATION ===');
                console.log('Current test:', currentTest);
                console.log('Current section:', currentSection);
                console.log('Current question:', currentQuestion);
                console.log('Editing question:', editingQuestion);
                if (currentTest && currentTest.sections) {
                  currentTest.sections.forEach((section, sectionIndex) => {
                    console.log(`Section ${sectionIndex + 1} (${section.title}):`, section);
                    if (section.questions) {
                      section.questions.forEach((question, questionIndex) => {
                        console.log(`  Question ${questionIndex + 1}:`, {
                          id: question.id,
                          topic: question.topic,
                          type: question.type,
                          answerType: question.answerType,
                          correctAnswer: question.correctAnswer
                        });
                      });
                    }
                  });
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              title="Verify Server Data"
            >
              Verify Server Data
            </button>
          )}

        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Title *
            </label>
            <DirectInput
              value={currentTest.title}
              onChange={(value) => setCurrentTest(prev => ({ ...prev, title: value }))}
              placeholder="Enter test title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Time (calculated)
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {currentTest.sections.reduce((total, section) => total + (section.timeLimit || 0), 0)} minutes
            </div>
            <p className="text-xs text-gray-500 mt-1">
              English sections: 32 min each • Math sections: 35 min each
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Description
            </label>
            <DirectTextarea
              value={currentTest.description}
              onChange={(value) => setCurrentTest(prev => ({ ...prev, description: value }))}
              placeholder="Enter test description..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Sections ({currentTest.sections.length})</h3>
          <button
            onClick={() => {
              setEditingSection(null);
              setCurrentSection({
                type: 'english',
                title: '',
                timeLimit: 65,
                questions: []
              });
              setCurrentView('section-builder');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FiPlus size={16} />
            Add Section
          </button>
        </div>

        <div className="space-y-3">
          {currentTest.sections.map((section, index) => (
            <div key={section.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">Section {index + 1}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    section.type === 'english' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {section.type === 'english' ? 'Reading & Writing' : 'Math'}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">{section.title}</h4>
                <p className="text-sm text-gray-600">{section.timeLimit} minutes • {section.questions?.length || 0} questions</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={() => {
                    setEditingSection(section);
                    setCurrentSection({
                      id: section.id,
                      title: section.title,
                      timeLimit: section.timeLimit || 65,
                      type: section.type || 'english',
                      questions: section.questions || []
                    });
                    setCurrentView('section-builder');
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600"
                  title="Edit Section"
                >
                  <FiEdit size={16} />
                </button>
                <button 
                  onClick={() => deleteSection(section.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Delete Section"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const RealSectionBuilder = () => {
      // Ensure currentSection is in sync with currentTest when this component renders
  useEffect(() => {
    if (editingSection && currentTest.sections) {
      const sectionFromTest = currentTest.sections.find(s => s.id === editingSection.id);
      if (sectionFromTest && JSON.stringify(sectionFromTest) !== JSON.stringify(currentSection)) {
        setCurrentSection(sectionFromTest);
      }
    }
  }, [currentTest.sections, editingSection]);

  // Debug: Monitor currentSection changes
  useEffect(() => {
    console.log('CurrentSection updated:', currentSection);
    console.log('Questions count:', currentSection.questions?.length || 0);
    if (currentSection.questions?.length > 0) {
      console.log('Last question data:', currentSection.questions[currentSection.questions.length - 1]);
      console.log('Last question has KaTeX:', currentSection.questions[currentSection.questions.length - 1]?.question?.includes('$'));
    }
  }, [currentSection]);

  // Auto-sync section state when component renders
  useEffect(() => {
    if (editingSection && currentTest.sections) {
      syncSectionState(editingSection.id);
    }
  }, [currentTest.sections, editingSection]);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingSection ? 'Edit Section' : 'Create Section'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingSection(null);
                setCurrentSection({
                  type: 'english',
                  title: '',
                  timeLimit: 32,
                  questions: []
                });
                setCurrentView('test-builder');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveSection}
              disabled={!currentSection.title || !currentSection.title.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingSection ? 'Update Section' : 'Create Section'}
            </button>
          </div>
        </div>

        {/* Enhanced Saved Data Display Panel for Section */}
        {editingSection && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
              <FiInfo size={20} />
              Saved Section Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-1">Section Type</div>
                <div className="text-sm text-gray-800">
                  {currentSection.type ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {currentSection.type === 'english' ? 'Reading & Writing' : 'Math'}
                    </span>
                  ) : (
                    <span className="text-red-600 text-xs">Not set</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-1">Time Limit</div>
                <div className="text-sm text-gray-800">
                  {currentSection.timeLimit ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currentSection.timeLimit} minutes
                    </span>
                  ) : (
                    <span className="text-red-600 text-xs">Not set</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-1">Questions Count</div>
                <div className="text-sm text-gray-800">
                  {currentSection.questions && currentSection.questions.length > 0 ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {currentSection.questions.length} questions
                    </span>
                  ) : (
                    <span className="text-orange-600 text-xs">No questions</span>
                  )}
                </div>
              </div>
            </div>
            {currentSection.questions && currentSection.questions.length > 0 && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-2">Question Types Summary</div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const typeCounts = {};
                    currentSection.questions.forEach(q => {
                      // Fix the logic: check if it's a written/grid-in question first
                      const type = (q.type === 'grid-in' || q.answerType === 'written') ? 'grid-in' : 'multiple-choice';
                      typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });
                    return Object.entries(typeCounts).map(([type, count]) => (
                      <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {type === 'multiple-choice' ? 'Multiple Choice' : 'Grid-in'}: {count}
                      </span>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

      <div className="bg-white border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Type
            </label>
            <select
              value={currentSection.type}
              onChange={(e) => {
                const newType = e.target.value;
                setCurrentSection(prev => ({ 
                  ...prev, 
                  type: newType,
                  timeLimit: newType === 'math' ? 35 : 32
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="english">Reading & Writing</option>
              <option value="math">Math</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Title *
            </label>
            <DirectInput
              value={currentSection.title || ''}
              onChange={(value) => setCurrentSection(prev => ({ ...prev, title: value }))}
              placeholder="Enter section title..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (fixed)
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {currentSection.type === 'math' ? '35' : '32'} minutes
            </div>
            <p className="text-xs text-gray-500 mt-1">
              English sections: 32 minutes • Math sections: 35 minutes
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Questions ({currentSection.questions.length})</h3>
          <button
            onClick={() => {
              setEditingQuestion(null);
              setCurrentQuestion({
                question: '',
                options: ['', '', '', ''],
                correctAnswer: 0,
                explanation: '',
                difficulty: 'medium',
                images: [],
                passage: '',
                answerType: currentSection.type === 'english' ? 'multiple-choice' : 'multiple-choice',
                writtenAnswer: '',
                acceptableAnswers: []
              });
              setCurrentView('question-builder');
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <FiPlus size={16} />
            Add Question
          </button>
        </div>

        <div className="space-y-3">
          {currentSection.questions.map((question, index) => (
            <div key={question.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {(question.type === 'multiple-choice' || question.answerType === 'multiple-choice') ? 'Multiple Choice' : 'Written Answer'}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">{question.content || question.question}</h4>
                <p className="text-sm text-gray-600">{question.difficulty}</p>
                {question.images && question.images.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">📷 {question.images.length} image(s)</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={() => {
                    loadQuestionForEditing(question);
                    setCurrentView('question-builder');
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600"
                  title="Edit Question"
                >
                  <FiEdit size={16} />
                </button>
                <button 
                  onClick={() => deleteQuestion(question.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Delete Question"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  };

  const RealQuestionBuilder = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingQuestion ? 'Edit Question' : 'Create Question'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCurrentView('section-builder');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={saveQuestionFixed}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <FiSave size={20} />
              {editingQuestion ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </div>

        {/* Enhanced Saved Data Display Panel */}
        {editingQuestion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <FiInfo size={20} />
              Saved Question Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-1">Question Type (Topic)</div>
                <div className="text-sm text-gray-800">
                  {currentQuestion.topic ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {currentQuestion.topic}
                    </span>
                  ) : (
                    <span className="text-red-600 text-xs">Not set</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-1">Answer Type</div>
                <div className="text-sm text-gray-800">
                  {currentQuestion.answerType ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currentQuestion.answerType === 'multiple-choice' ? 'Multiple Choice' : 'Written'}
                    </span>
                  ) : (
                    <span className="text-red-600 text-xs">Not set</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-1">Correct Answer</div>
                <div className="text-sm text-gray-800">
                  {currentQuestion.answerType === 'written' ? (
                    currentQuestion.writtenAnswer ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {currentQuestion.writtenAnswer}
                      </span>
                    ) : (
                      <span className="text-red-600 text-xs">Not set</span>
                    )
                  ) : (
                    currentQuestion.correctAnswer !== undefined && currentQuestion.correctAnswer !== null ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Option {String.fromCharCode(65 + parseInt(currentQuestion.correctAnswer))}
                      </span>
                    ) : (
                      <span className="text-red-600 text-xs">Not set</span>
                    )
                  )}
                </div>
              </div>
            </div>
            {currentQuestion.answerType === 'written' && currentQuestion.acceptableAnswers && currentQuestion.acceptableAnswers.length > 0 && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-2">Alternative Answers</div>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.acceptableAnswers.map((answer, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {answer}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white border rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={currentQuestion.difficulty}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type
              </label>
              <select
                value={currentQuestion.topic || ''}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, topic: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Question Type</option>
                {currentSection.type === 'english' ? (
                  <>
                    <option value="Information and Ideas">Information and Ideas</option>
                    <option value="Craft and Structure">Craft and Structure</option>
                    <option value="Expression of Ideas">Expression of Ideas</option>
                    <option value="Standard English Conventions">Standard English Conventions</option>
                  </>
                ) : (
                  <>
                    <option value="Algebra">Algebra</option>
                    <option value="Advanced Math">Advanced Math</option>
                    <option value="Problem-Solving and Data Analysis">Problem-Solving and Data Analysis</option>
                    <option value="Geometry and Trigonometry">Geometry and Trigonometry</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {currentSection.type === 'math' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="answerType"
                    value="multiple-choice"
                    checked={currentQuestion.answerType === 'multiple-choice'}
                    onChange={(e) => setCurrentQuestion(prev => ({ 
                      ...prev, 
                      answerType: e.target.value,
                      options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : []
                    }))}
                    className="mr-2"
                  />
                  Multiple Choice (A, B, C, D)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="answerType"
                    value="written"
                    checked={currentQuestion.answerType === 'written'}
                    onChange={(e) => setCurrentQuestion(prev => ({ 
                      ...prev, 
                      answerType: e.target.value,
                      options: []
                    }))}
                    className="mr-2"
                  />
                  Written Answer (Grid-in)
                </label>
              </div>
            </div>
          )}

          {currentSection.type === 'english' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reading Passage
              </label>
              <KaTeXEditor
                value={currentQuestion.passage}
                onChange={(value) => setCurrentQuestion(prev => ({ ...prev, passage: value }))}
                placeholder="Enter the reading passage here..."
                rows={8}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text
            </label>
            <KaTeXEditor
              value={currentQuestion.question}
              onChange={(value) => setCurrentQuestion(prev => ({ ...prev, question: value }))}
              placeholder="Enter your question here..."
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Images (Optional)
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-200 text-sm"
              >
                <FiUpload size={16} />
                Upload Image
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {currentQuestion.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentQuestion.images.map(image => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX size={14} />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(currentSection.type === 'english' || currentQuestion.answerType === 'multiple-choice') && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Options
                </label>
                <button
                  onClick={addOption}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-200 text-sm"
                >
                  <FiPlus size={16} />
                  Add Option
                </button>
              </div>
              
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <div key={`option-${index}`} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                      className="w-5 h-5 text-blue-600 mt-2"
                    />
                    <div className="flex-1 flex items-start gap-3">
                      <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700 flex-shrink-0">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <KaTeXEditor
                          value={option}
                          onChange={(value) => handleOptionChange(index, value)}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          rows={3}
                        />
                      </div>
                      {currentQuestion.options.length > 2 && (
                        <button
                          onClick={() => removeOption(index)}
                          className="p-2 text-gray-400 hover:text-red-600 flex-shrink-0"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentQuestion.answerType === 'written' && (
            <div>
              <MultipleAnswersEditor
                primaryAnswer={currentQuestion.writtenAnswer}
                onPrimaryAnswerChange={(value) => setCurrentQuestion(prev => ({ ...prev, writtenAnswer: value }))}
                acceptableAnswers={currentQuestion.acceptableAnswers || []}
                onAcceptableAnswersChange={(answers) => setCurrentQuestion(prev => ({ ...prev, acceptableAnswers: answers }))}
                placeholder="Enter the correct answer..."
                label="Correct Answer"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation
            </label>
            <KaTeXEditor
              value={currentQuestion.explanation}
              onChange={(value) => setCurrentQuestion(prev => ({ ...prev, explanation: value }))}
              placeholder="Explain the correct answer..."
              rows={3}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderRealTestView = () => {
    switch (currentView) {
      case 'dashboard':
        return <RealTestDashboard />;
      case 'test-builder':
        return <RealTestBuilder />;
      case 'section-builder':
        return <RealSectionBuilder />;
      case 'question-builder':
        return <RealQuestionBuilder />;
      default:
        return <RealTestDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Real Test Management</h1>
              <nav className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-1 rounded ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Dashboard
                </button>
                {currentView !== 'dashboard' && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600 capitalize">{currentView.replace('-', ' ')}</span>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Total Real Tests: {tests.length}
              </span>
              <button
                onClick={testDataPreservation}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                title="Test Data Preservation"
              >
                Test Data
              </button>
              <button
                onClick={testServerDataPreservation}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                title="Server Data Preservation"
              >
                Server Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderRealTestView()}
      </div>
    </div>
  );
};

const MockTestManagement = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingTest, setEditingTest] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTest, setCurrentTest] = useState({
    title: '',
    description: '',
    timeLimit: 180,
    sections: [],
    testType: 'study-plan'
  });
  const [currentSection, setCurrentSection] = useState({
    type: 'english',
    title: '',
    timeLimit: 65,
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    difficulty: 'medium',
    images: [],
    passage: '',
    answerType: 'multiple-choice',
    writtenAnswer: '',
    acceptableAnswers: []
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await testsAPI.getAll();
      const mockTests = response.data.tests.filter(test => 
        test.testType === 'study-plan'
      ).map(test => ({
        ...test,
        id: test._id || test.id,
        visible: test.isPublic !== undefined ? test.isPublic : true,
        created: test.createdAt ? new Date(test.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
      }));
      setTests(mockTests);
      setFilteredTests(mockTests);
    } catch (error) {
      console.error('Error loading tests:', error);
      setTests([]);
      setFilteredTests([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter tests based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTests(tests);
    } else {
      const filtered = tests.filter(test => 
        test.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTests(filtered);
    }
  }, [searchTerm, tests]);

  const toggleTestVisibility = async (testId, newVisibility) => {
    try {
      const test = tests.find(t => t.id === testId);
      if (test) {
        const updatePayload = {
          isPublic: newVisibility === 'all',
          visibleTo: newVisibility
        };
        
        const response = await testsAPI.update(testId, updatePayload);
        
        setTests(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, visible: newVisibility === 'all', visibleTo: newVisibility }
            : test
        ));
        
        const visibilityText = {
          'all': 'visible to all users',
          'free': 'visible to free accounts only',
          'student': 'visible to student accounts only'
        };
        
        alert(`Test made ${visibilityText[newVisibility]} successfully!`);
      }
    } catch (error) {
      console.error('Error toggling test visibility:', error);
      alert('Failed to update test visibility. Please try again.');
    }
  };

  const deleteTest = async (testId) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await testsAPI.delete(testId);
        setTests(prev => prev.filter(test => test.id !== testId));
        alert('Test deleted successfully!');
      } catch (error) {
        console.error('Error deleting test:', error);
        alert('Failed to delete test. Please try again.');
      }
    }
  };

  const editTest = async (test) => {
    setEditingTest(test);
    
    // Transform sections from API format to client format
    const transformedSections = (test.sections || []).map(section => ({
      id: section._id || section.id || Date.now(),
      title: section.name || section.title || '',
      description: section.instructions || section.description || '',
      timeLimit: section.type === 'math' ? 35 : 32, // Fixed time limits
      type: section.type || 'english',
      questions: section.questions || []
    }));
    
    setCurrentTest({
      id: test.id,
      title: test.title,
      description: test.description,
      timeLimit: transformedSections.reduce((total, section) => total + section.timeLimit, 0), // Sum of section times
      sections: transformedSections,
      testType: 'study-plan'
    });
    setCurrentView('test-builder');
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now(),
          url: e.target.result,
          name: file.name
        };
        setCurrentQuestion(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (imageId) => {
    setCurrentQuestion(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const removeOption = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const saveTest = async () => {
    try {
      setSaving(true);
      
      if (!currentTest.title.trim()) {
        alert('Test title is required');
        return;
      }

      const transformedSections = (currentTest.sections || [])
        .filter(section => section.questions && section.questions.length > 0)
        .map(section => ({
          name: section.title,
          type: section.type || 'english',
          timeLimit: section.timeLimit || 65,
          questionCount: section.questions ? section.questions.length : 0,
          instructions: section.description || 'Complete all questions in this section.',
          questions: (section.questions || []).map(question => ({
            ...question,
            // Explicitly preserve the topic field
            topic: question.topic || 'general',
            // Ensure correctAnswer is always a string as required by the schema
            correctAnswer: question.answerType === 'written' 
              ? (question.writtenAnswer || question.correctAnswer || '').toString()
              : (question.correctAnswer || 0).toString(),
            // Ensure type and answerType are properly set
            type: question.type || (question.answerType === 'written' ? 'grid-in' : 'multiple-choice'),
            answerType: question.answerType || (question.type === 'grid-in' ? 'written' : 'multiple-choice')
          }))
        }));

      // Debug: Log the transformed sections
      console.log('=== SAVING MOCK TEST ===');
      console.log('Transformed sections:', transformedSections);
      console.log('Question types in transformed data:', transformedSections?.map(s => ({
        section: s.name,
        questions: s.questions?.map(q => ({
          id: q.id,
          type: q.type,
          answerType: q.answerType
        }))
      })));

      if (transformedSections.length === 0) {
        alert('Please add at least one question to a section before saving the test.');
        return;
      }

      const description = currentTest.description || 'A comprehensive study plan for students to practice and improve their skills.';
      if (description.length < 10) {
        alert('Description must be at least 10 characters long. Please provide a more detailed description.');
        return;
      }

      const testData = {
        title: currentTest.title.trim(),
        description: description,
        type: 'custom',
        testType: 'study-plan',
        difficulty: 'medium',
        sections: transformedSections,
        totalTime: currentTest.timeLimit || 180,
        totalQuestions: currentTest.sections ? currentTest.sections.reduce((total, section) => total + (section.questions ? section.questions.length : 0), 0) : 0
      };

      console.log('Final mock test data to save:', testData);
      console.log('Question types in final mock test data:', testData.sections?.map(s => ({
        section: s.name,
        questions: s.questions?.map(q => ({
          id: q.id,
          type: q.type,
          answerType: q.answerType,
          correctAnswer: q.correctAnswer,
          hasOptions: q.options && q.options.length > 0
        }))
      })));

      // Log the exact data being sent to the server
      console.log('=== DATA BEING SENT TO SERVER (MOCK) ===');
      console.log('Raw mock test data:', JSON.stringify(testData, null, 2));

      let response;
      if (editingTest) {
        response = await testsAPI.update(editingTest.id, testData);
        const updatedTest = {
          ...response.data.test,
          id: response.data.test._id || response.data.test.id,
          testType: 'study-plan',
          visible: response.data.test.isPublic !== undefined ? response.data.test.isPublic : true,
          created: response.data.test.createdAt ? new Date(response.data.test.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
        };
        setTests(prev => prev.map(test => test.id === editingTest.id ? updatedTest : test));
        setCurrentTest(prev => ({
          ...prev,
          id: updatedTest.id,
          _id: updatedTest._id
        }));
      } else {
        response = await testsAPI.create(testData);
        const newTest = {
          ...response.data.test,
          id: response.data.test._id || response.data.test.id,
          testType: 'study-plan',
          visible: response.data.test.isPublic !== undefined ? response.data.test.isPublic : true,
          created: response.data.test.createdAt ? new Date(response.data.test.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
        };
        setTests(prev => [...prev, newTest]);
      }

      // Verify that question types are preserved in the saved test
      if (response.data.test && response.data.test.sections) {
        console.log('=== VERIFICATION: SAVED MOCK TEST DATA ===');
        console.log('Question types in saved mock test:', response.data.test.sections?.map(s => ({
          section: s.name,
          questions: s.questions?.map(q => ({
            id: q.id,
            type: q.type,
            answerType: q.answerType
          }))
        })));
      }

      alert(editingTest ? 'Test updated successfully!' : 'Test created successfully!');
      
      setEditingTest(null);
      setCurrentTest({
        title: '',
        description: '',
        timeLimit: 180,
        sections: [],
        testType: 'study-plan'
      });
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Failed to save test. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Enhanced question saving with KaTeX preservation
  const saveQuestion = async () => {
    try {
      if (!currentQuestion.question.trim()) {
        alert('Question text is required');
        return;
      }

      // Deep clone the current question to preserve all data
      const questionToSave = JSON.parse(JSON.stringify({
        id: editingQuestion ? editingQuestion.id : Date.now(),
        question: currentQuestion.question,
        content: currentQuestion.question,
        topic: currentQuestion.topic || 'general', // This is the question type (e.g., "Information & Ideas", "Algebra")
        difficulty: currentQuestion.difficulty || 'medium',
        explanation: currentQuestion.explanation || '',
        passage: currentQuestion.passage || '',
        type: currentQuestion.answerType === 'written' ? 'grid-in' : 'multiple-choice', // This is the answer type
        options: currentQuestion.answerType === 'multiple-choice' 
          ? currentQuestion.options.map((opt, index) => ({
              content: opt || '',
              isCorrect: index === currentQuestion.correctAnswer
            }))
          : [],
        correctAnswer: currentQuestion.answerType === 'written' 
          ? currentQuestion.writtenAnswer || ''
          : currentQuestion.correctAnswer,
        images: (currentQuestion.images || []).map(img => ({
          url: img.url,
          name: img.name
        })),
        answerType: currentQuestion.answerType, // This is the answer type (multiple-choice or written)
        writtenAnswer: currentQuestion.writtenAnswer || '',
        acceptableAnswers: currentQuestion.acceptableAnswers || []
      }));

      // Ensure question type (topic) is properly preserved when editing
      if (editingQuestion) {
        // When editing, preserve the original question topic if it exists
        questionToSave.topic = editingQuestion.topic || currentQuestion.topic || 'general';
        // Keep the answer type as set by the user
        questionToSave.answerType = currentQuestion.answerType;
        // Set the type based on answer type
        questionToSave.type = currentQuestion.answerType === 'written' ? 'grid-in' : 'multiple-choice';
      }

      // Debug logging to verify the separation
      console.log('=== SAVING MOCK QUESTION (FIXED) ===');
      console.log('Original question type (topic):', editingQuestion?.topic || currentQuestion.topic || 'general');
      console.log('Original answer type:', editingQuestion?.answerType || currentQuestion.answerType);
      console.log('Saved question type (topic):', questionToSave.topic);
      console.log('Saved answer type:', questionToSave.answerType);
      console.log('Saved type field:', questionToSave.type);

      // Debug: Log the question data being saved
      console.log('=== SAVING QUESTION ===');
      console.log('Question text:', questionToSave.question);
      console.log('Has KaTeX in question:', questionToSave.question?.includes('$'));
      console.log('Explanation:', questionToSave.explanation);
      console.log('Has KaTeX in explanation:', questionToSave.explanation?.includes('$'));
      console.log('Passage:', questionToSave.passage);
      console.log('Has KaTeX in passage:', questionToSave.passage?.includes('$'));
      console.log('Options:', questionToSave.options);
      console.log('Options with KaTeX:', questionToSave.options?.map(opt => opt.content?.includes('$')));

      // Create a new questions array with the updated question
      const updatedQuestions = editingQuestion
        ? currentSection.questions.map(q => q.id === editingQuestion.id ? questionToSave : q)
        : [...currentSection.questions, questionToSave];

      // Create updated section
      const updatedSection = {
        ...currentSection,
        questions: updatedQuestions
      };

      // Update the test state first
      setCurrentTest(prev => {
        const newTest = {
          ...prev,
          sections: prev.sections.map(section => 
            section.id === currentSection.id ? updatedSection : section
          )
        };
        
        console.log('=== UPDATED TEST STATE ===');
        console.log('Test sections count:', newTest.sections.length);
        console.log('Current section questions count:', updatedSection.questions.length);
        
        return newTest;
      });

      // Update the section state
      setCurrentSection(updatedSection);

      // Verify the data was saved correctly
      setTimeout(() => {
        console.log('=== VERIFICATION ===');
        console.log('Current section questions after save:', currentSection.questions?.length);
        console.log('Last question saved:', updatedQuestions[updatedQuestions.length - 1]);
      }, 100);

      alert(editingQuestion ? 'Question updated successfully!' : 'Question created successfully!');
      setEditingQuestion(null);
      setCurrentView('section-builder');
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    }
  };

  const saveSection = () => {
    if (!currentSection.title.trim()) {
      alert('Section title is required');
      return;
    }

    const sectionData = {
      title: currentSection.title,
      timeLimit: currentSection.type === 'math' ? 35 : 32, // Fixed time limits
      type: currentSection.type || 'english',
      questions: currentSection.questions
    };

    if (editingSection) {
      setCurrentTest(prev => ({
        ...prev,
        sections: prev.sections.map(s => s.id === editingSection.id ? { ...s, ...sectionData } : s)
      }));
    } else {
      const newSection = {
        id: Date.now(),
        ...sectionData
      };
      setCurrentTest(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
      }));
    }

    setEditingSection(null);
    setCurrentSection({
      type: 'english',
      title: '',
      timeLimit: 32,
      questions: []
    });
    setCurrentView('test-builder');
  };

  const deleteQuestion = (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      // Create updated section without the deleted question
      const updatedSection = {
        ...currentSection,
        questions: currentSection.questions.filter(q => q.id !== questionId)
      };

      // Update the current test
      setCurrentTest(prev => {
        const updatedSections = prev.sections.map(section => 
          section.id === currentSection.id ? updatedSection : section
        );
        
        return {
          ...prev,
          sections: updatedSections
        };
      });

      // Update current section state
      setCurrentSection(updatedSection);
    }
  };

  const deleteSection = (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      setCurrentTest(prev => ({
        ...prev,
        sections: prev.sections.filter(s => s.id !== sectionId)
      }));
    }
  };

  // Enhanced state synchronization to prevent data loss
  const syncSectionState = (sectionId) => {
    setCurrentTest(prev => {
      const section = prev.sections.find(s => s.id === sectionId);
      if (section && JSON.stringify(section) !== JSON.stringify(currentSection)) {
        console.log('Syncing section state:', section.title);
        setCurrentSection(section);
      }
      return prev;
    });
  };

  // Enhanced question loading with KaTeX preservation
  const loadQuestionForEditing = (question) => {
    console.log('=== LOADING QUESTION FOR EDITING ===');
    console.log('Original question data:', question);
    
    // Determine the correct answer type and value
    let correctAnswer = 0;
    let writtenAnswer = '';
    
    if (question.type === 'grid-in' || question.answerType === 'written') {
      // For written/grid-in questions, use the writtenAnswer or correctAnswer as string
      writtenAnswer = question.writtenAnswer || question.correctAnswer || '';
    } else {
      // For multiple choice questions, find the correct option index
      if (question.options && question.options.length > 0) {
        const correctOptionIndex = question.options.findIndex(opt => {
          if (typeof opt === 'string') {
            return opt === question.correctAnswer;
          } else {
            return opt.isCorrect === true || opt.content === question.correctAnswer;
          }
        });
        correctAnswer = correctOptionIndex >= 0 ? correctOptionIndex : 0;
      }
    }
    
    const questionData = {
      id: question.id,
      question: question.question || question.content || '',
      topic: question.topic || 'general', // Add topic loading
      options: question.options && question.options.length > 0 
        ? question.options.map(opt => typeof opt === 'string' ? opt : opt.content || '')
        : ['', '', '', ''],
      correctAnswer: correctAnswer,
      explanation: question.explanation || '',
      difficulty: question.difficulty || 'medium',
      images: question.images || [],
      passage: question.passage || '',
      answerType: question.type === 'grid-in' ? 'written' : 'multiple-choice',
      writtenAnswer: writtenAnswer,
      acceptableAnswers: question.acceptableAnswers || []
    };

    console.log('Processed question data:', questionData);
    console.log('KaTeX content preserved:', {
      question: questionData.question?.includes('$'),
      explanation: questionData.explanation?.includes('$'),
      passage: questionData.passage?.includes('$'),
      options: questionData.options?.map(opt => opt.includes('$'))
    });

    setCurrentQuestion(questionData);
    setEditingQuestion(question);
  };

  // Function to create complete question data with all fields preserved (MockTestManagement)
  const createCompleteQuestionDataMock = (currentQuestion, editingQuestion) => {
    const questionData = {
      id: editingQuestion ? editingQuestion.id : Date.now(),
      question: currentQuestion.question,
      content: currentQuestion.question,
      topic: currentQuestion.topic || 'general',
      difficulty: currentQuestion.difficulty || 'medium',
      explanation: currentQuestion.explanation || '',
      passage: currentQuestion.passage || '',
      // Preserve the original question type, don't override it
      type: currentQuestion.type || (currentQuestion.answerType === 'written' ? 'grid-in' : 'multiple-choice'),
      options: currentQuestion.answerType === 'multiple-choice' 
        ? currentQuestion.options.map((opt, index) => ({
            content: opt || '',
            isCorrect: index === currentQuestion.correctAnswer
          }))
        : [],
      correctAnswer: currentQuestion.answerType === 'written' 
        ? currentQuestion.writtenAnswer || ''
        : currentQuestion.correctAnswer,
      images: (currentQuestion.images || []).map(img => ({
        url: img.url,
        name: img.name
      })),
      answerType: currentQuestion.answerType,
      writtenAnswer: currentQuestion.writtenAnswer || '',
      acceptableAnswers: currentQuestion.acceptableAnswers || []
    };

    console.log('=== COMPLETE QUESTION DATA CREATED (MOCK) ===');
    console.log('Question ID:', questionData.id);
    console.log('Question type (topic):', questionData.topic);
    console.log('Answer type:', questionData.answerType);
    console.log('Question text:', questionData.question?.substring(0, 50) + '...');
    console.log('Options count:', questionData.options?.length || 0);
    console.log('Has written answer:', !!questionData.writtenAnswer);
    console.log('Acceptable answers:', questionData.acceptableAnswers);
    
    return questionData;
  };

  // Fixed saveQuestion function for Mock tests that properly preserves question types
  const saveQuestionFixedMock = async () => {
    try {
      if (!currentQuestion.question.trim()) {
        alert('Question text is required');
        return;
      }

      const questionToSave = createCompleteQuestionDataMock(currentQuestion, editingQuestion);
      
      const updatedQuestions = editingQuestion
        ? currentSection.questions.map(q => q.id === editingQuestion.id ? questionToSave : q)
        : [...currentSection.questions, questionToSave];
      
      const updatedSection = { ...currentSection, questions: updatedQuestions };
      
      setCurrentTest(prev => {
        const newTest = { ...prev, sections: prev.sections.map(section => 
          section.id === currentSection.id ? updatedSection : section
        )};
        console.log('=== UPDATED MOCK TEST STATE ===');
        console.log('Test sections count:', newTest.sections.length);
        console.log('Current section questions count:', updatedSection.questions.length);
        console.log('Question types in updated section:', updatedSection.questions.map(q => ({ 
          id: q.id, 
          type: q.type, 
          answerType: q.answerType,
          correctAnswer: q.correctAnswer 
        })));
        return newTest;
      });
      
      setCurrentSection(updatedSection);
      
      setTimeout(() => {
        console.log('=== MOCK VERIFICATION ===');
        console.log('Current section questions after save:', currentSection.questions?.length);
        console.log('Last question saved:', updatedQuestions[updatedQuestions.length - 1]);
        console.log('Question types after save:', updatedQuestions.map(q => ({ 
          id: q.id, 
          type: q.type, 
          answerType: q.answerType,
          correctAnswer: q.correctAnswer 
        })));
      }, 100);
      
      alert(editingQuestion ? 'Question updated successfully!' : 'Question created successfully!');
      setEditingQuestion(null);
      setCurrentView('section-builder');
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Failed to save question. Please try again.');
    }
  };



  const MockTestDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Mock Test Management</h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search tests by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
            />
            <button
              onClick={() => {
                setCurrentTest({ title: '', description: '', timeLimit: 180, sections: [], testType: 'study-plan' });
                setCurrentView('test-builder');
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <FiPlus size={20} />
              Create Mock Test
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tests...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12">
            <FiBookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No mock tests found
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first mock test to get started.
            </p>
            <button
              onClick={() => {
                setCurrentTest({ title: '', description: '', timeLimit: 180, sections: [], testType: 'study-plan' });
                setCurrentView('test-builder');
              }}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white"
            >
              Create Your First Mock Test
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTests.map(test => (
              <div key={test.id} className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <FiClock size={16} />
                        {test.duration} minutes
                      </span>
                      <span>{test.questions} questions</span>
                      <span>{Array.isArray(test.sections) ? test.sections.length : 0} sections</span>
                      <span className="text-xs">{test.created}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Mock Test
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      test.visibleTo === 'all' 
                        ? 'bg-green-100 text-green-800'
                        : test.visibleTo === 'student'
                        ? 'bg-blue-100 text-blue-800'
                        : test.visibleTo === 'free'
                        ? 'bg-yellow-100 text-yellow-800'
                        : test.visible
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {test.visibleTo === 'all' ? 'All Users' :
                       test.visibleTo === 'student' ? 'Student Only' :
                       test.visibleTo === 'free' ? 'Free Only' :
                       test.visible ? 'Visible' : 'Hidden'}
                    </span>
                    <button 
                      onClick={() => editTest(test)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Edit Test"
                    >
                      <FiEdit size={16} />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => {
                          const visibility = test.visibleTo === 'all' ? 'free' : 
                                           test.visibleTo === 'free' ? 'student' : 'all';
                          toggleTestVisibility(test.id, visibility);
                        }}
                        className={`p-2 ${test.visibleTo === 'all' ? 'text-green-600' : 
                                         test.visibleTo === 'student' ? 'text-blue-600' : 
                                         test.visibleTo === 'free' ? 'text-yellow-600' : 
                                         test.visible ? 'text-blue-600' : 'text-gray-400'} hover:text-blue-600`}
                        title="Change Visibility"
                      >
                        <FiEye size={16} />
                      </button>
                    </div>
                    <button 
                      onClick={() => deleteTest(test.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete Test"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const MockTestBuilder = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {editingTest ? 'Edit Mock Test' : 'Create Mock Test'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingTest(null);
              setCurrentTest({
                title: '',
                description: '',
                timeLimit: 0,
                sections: [],
                testType: 'study-plan'
              });
              setCurrentView('dashboard');
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={saveTest}
            disabled={saving || !currentTest.title.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : (editingTest ? 'Update Test' : 'Create Test')}
          </button>

        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Title *
            </label>
            <DirectInput
              value={currentTest.title}
              onChange={(value) => setCurrentTest(prev => ({ ...prev, title: value }))}
              placeholder="Enter test title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Time (calculated)
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {currentTest.sections.reduce((total, section) => total + (section.timeLimit || 0), 0)} minutes
            </div>
            <p className="text-xs text-gray-500 mt-1">
              English sections: 32 min each • Math sections: 35 min each
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Description
            </label>
            <DirectTextarea
              value={currentTest.description}
              onChange={(value) => setCurrentTest(prev => ({ ...prev, description: value }))}
              placeholder="Enter test description..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Sections ({currentTest.sections.length})</h3>
          <button
            onClick={() => {
              setEditingSection(null);
              setCurrentSection({
                type: 'english',
                title: '',
                timeLimit: 65,
                questions: []
              });
              setCurrentView('section-builder');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FiPlus size={16} />
            Add Section
          </button>
        </div>

        <div className="space-y-3">
          {currentTest.sections.map((section, index) => (
            <div key={section.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">Section {index + 1}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    section.type === 'english' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {section.type === 'english' ? 'Reading & Writing' : 'Math'}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">{section.title}</h4>
                <p className="text-sm text-gray-600">{section.timeLimit} minutes • {section.questions?.length || 0} questions</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={() => {
                    setEditingSection(section);
                    setCurrentSection({
                      id: section.id,
                      title: section.title,
                      timeLimit: section.timeLimit || 65,
                      type: section.type || 'english',
                      questions: section.questions || []
                    });
                    setCurrentView('section-builder');
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600"
                  title="Edit Section"
                >
                  <FiEdit size={16} />
                </button>
                <button 
                  onClick={() => deleteSection(section.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Delete Section"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const MockSectionBuilder = () => {
    // Ensure currentSection is in sync with currentTest when this component renders
    useEffect(() => {
      if (editingSection && currentTest.sections) {
        const sectionFromTest = currentTest.sections.find(s => s.id === editingSection.id);
        if (sectionFromTest && JSON.stringify(sectionFromTest) !== JSON.stringify(currentSection)) {
          setCurrentSection(sectionFromTest);
        }
      }
    }, [currentTest.sections, editingSection]);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingSection ? 'Edit Section' : 'Create Section'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingSection(null);
                setCurrentSection({
                  type: 'english',
                  title: '',
                  timeLimit: 32,
                  questions: []
                });
                setCurrentView('test-builder');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveSection}
              disabled={!currentSection.title || !currentSection.title.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingSection ? 'Update Section' : 'Create Section'}
            </button>
          </div>
        </div>

        {/* Enhanced Saved Data Display Panel for Section */}
        {editingSection && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
              <FiInfo size={20} />
              Saved Section Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-1">Section Type</div>
                <div className="text-sm text-gray-800">
                  {currentSection.type ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {currentSection.type === 'english' ? 'Reading & Writing' : 'Math'}
                    </span>
                  ) : (
                    <span className="text-red-600 text-xs">Not set</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-1">Time Limit</div>
                <div className="text-sm text-gray-800">
                  {currentSection.timeLimit ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currentSection.timeLimit} minutes
                    </span>
                  ) : (
                    <span className="text-red-600 text-xs">Not set</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-1">Questions Count</div>
                <div className="text-sm text-gray-800">
                  {currentSection.questions && currentSection.questions.length > 0 ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {currentSection.questions.length} questions
                    </span>
                  ) : (
                    <span className="text-orange-600 text-xs">No questions</span>
                  )}
                </div>
              </div>
            </div>
            {currentSection.questions && currentSection.questions.length > 0 && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-green-200">
                <div className="text-sm font-medium text-green-700 mb-2">Question Types Summary</div>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const typeCounts = {};
                    currentSection.questions.forEach(q => {
                      // Fix the logic: check if it's a written/grid-in question first
                      const type = (q.type === 'grid-in' || q.answerType === 'written') ? 'grid-in' : 'multiple-choice';
                      typeCounts[type] = (typeCounts[type] || 0) + 1;
                    });
                    return Object.entries(typeCounts).map(([type, count]) => (
                      <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {type === 'multiple-choice' ? 'Multiple Choice' : 'Grid-in'}: {count}
                      </span>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

      <div className="bg-white border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Type
            </label>
            <select
              value={currentSection.type}
              onChange={(e) => {
                const newType = e.target.value;
                setCurrentSection(prev => ({ 
                  ...prev, 
                  type: newType,
                  timeLimit: newType === 'math' ? 35 : 65
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="english">Reading & Writing</option>
              <option value="math">Math</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Title *
            </label>
            <DirectInput
              value={currentSection.title || ''}
              onChange={(value) => setCurrentSection(prev => ({ ...prev, title: value }))}
              placeholder="Enter section title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <DirectInput
              value={currentSection.timeLimit || 65}
              onChange={(value) => setCurrentSection(prev => ({ ...prev, timeLimit: parseInt(value) || 65 }))}
              placeholder={currentSection.type === 'math' ? '35' : '65'}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Questions ({currentSection.questions.length})</h3>
          <button
            onClick={() => {
              setEditingQuestion(null);
              setCurrentQuestion({
                question: '',
                options: ['', '', '', ''],
                correctAnswer: 0,
                explanation: '',
                difficulty: 'medium',
                images: [],
                passage: '',
                answerType: currentSection.type === 'english' ? 'multiple-choice' : 'multiple-choice',
                writtenAnswer: '',
                acceptableAnswers: []
              });
              setCurrentView('question-builder');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FiPlus size={16} />
            Add Question
          </button>
        </div>

        <div className="space-y-3">
          {currentSection.questions.map((question, index) => (
            <div key={question.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {(question.type === 'multiple-choice' || question.answerType === 'multiple-choice') ? 'Multiple Choice' : 'Written Answer'}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">{question.content || question.question}</h4>
                <p className="text-sm text-gray-600">{question.difficulty}</p>
                {question.images && question.images.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">📷 {question.images.length} image(s)</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button 
                  onClick={() => {
                    loadQuestionForEditing(question);
                    setCurrentView('question-builder');
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600"
                  title="Edit Question"
                >
                  <FiEdit size={16} />
                </button>
                <button 
                  onClick={() => deleteQuestion(question.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Delete Question"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  };

  const MockQuestionBuilder = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingQuestion ? 'Edit Question' : 'Create Question'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCurrentView('section-builder');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={saveQuestionFixedMock}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <FiSave size={20} />
              {editingQuestion ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </div>

        {/* Enhanced Saved Data Display Panel */}
        {editingQuestion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <FiInfo size={20} />
              Saved Question Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-1">Question Type (Topic)</div>
                <div className="text-sm text-gray-800">
                  {currentQuestion.topic ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {currentQuestion.topic}
                    </span>
                  ) : (
                    <span className="text-red-600 text-xs">Not set</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-1">Answer Type</div>
                <div className="text-sm text-gray-800">
                  {currentQuestion.answerType ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {currentQuestion.answerType === 'multiple-choice' ? 'Multiple Choice' : 'Written'}
                    </span>
                  ) : (
                    <span className="text-red-600 text-xs">Not set</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-1">Correct Answer</div>
                <div className="text-sm text-gray-800">
                  {currentQuestion.answerType === 'written' ? (
                    currentQuestion.writtenAnswer ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {currentQuestion.writtenAnswer}
                      </span>
                    ) : (
                      <span className="text-red-600 text-xs">Not set</span>
                    )
                  ) : (
                    currentQuestion.correctAnswer !== undefined && currentQuestion.correctAnswer !== null ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Option {String.fromCharCode(65 + parseInt(currentQuestion.correctAnswer))}
                      </span>
                    ) : (
                      <span className="text-red-600 text-xs">Not set</span>
                    )
                  )}
                </div>
              </div>
            </div>
            {currentQuestion.answerType === 'written' && currentQuestion.acceptableAnswers && currentQuestion.acceptableAnswers.length > 0 && (
              <div className="mt-3 bg-white rounded-lg p-3 border border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-2">Alternative Answers</div>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.acceptableAnswers.map((answer, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {answer}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white border rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={currentQuestion.difficulty}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type
              </label>
              <select
                value={currentQuestion.topic || ''}
                onChange={(e) => setCurrentQuestion(prev => ({ ...prev, topic: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Question Type</option>
                {currentSection.type === 'english' ? (
                  <>
                    <option value="Information and Ideas">Information and Ideas</option>
                    <option value="Craft and Structure">Craft and Structure</option>
                    <option value="Expression of Ideas">Expression of Ideas</option>
                    <option value="Standard English Conventions">Standard English Conventions</option>
                  </>
                ) : (
                  <>
                    <option value="Algebra">Algebra</option>
                    <option value="Advanced Math">Advanced Math</option>
                    <option value="Problem-Solving and Data Analysis">Problem-Solving and Data Analysis</option>
                    <option value="Geometry and Trigonometry">Geometry and Trigonometry</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {currentSection.type === 'math' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="answerType"
                    value="multiple-choice"
                    checked={currentQuestion.answerType === 'multiple-choice'}
                    onChange={(e) => setCurrentQuestion(prev => ({ 
                      ...prev, 
                      answerType: e.target.value,
                      options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : []
                    }))}
                    className="mr-2"
                  />
                  Multiple Choice (A, B, C, D)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="answerType"
                    value="written"
                    checked={currentQuestion.answerType === 'written'}
                    onChange={(e) => setCurrentQuestion(prev => ({ 
                      ...prev, 
                      answerType: e.target.value,
                      options: []
                    }))}
                    className="mr-2"
                  />
                  Written Answer (Grid-in)
                </label>
              </div>
            </div>
          )}

          {currentSection.type === 'english' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reading Passage
              </label>
              <KaTeXEditor
                value={currentQuestion.passage}
                onChange={(value) => setCurrentQuestion(prev => ({ ...prev, passage: value }))}
                placeholder="Enter the reading passage here..."
                rows={8}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text
            </label>
            <KaTeXEditor
              value={currentQuestion.question}
              onChange={(value) => setCurrentQuestion(prev => ({ ...prev, question: value }))}
              placeholder="Enter your question here..."
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Images (Optional)
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-200 text-sm"
              >
                <FiUpload size={16} />
                Upload Image
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {currentQuestion.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentQuestion.images.map(image => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX size={14} />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(currentSection.type === 'english' || currentQuestion.answerType === 'multiple-choice') && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Options
                </label>
                <button
                  onClick={addOption}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-gray-200 text-sm"
                >
                  <FiPlus size={16} />
                  Add Option
                </button>
              </div>
              
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <div key={`option-${index}`} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={currentQuestion.correctAnswer === index}
                      onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                      className="w-5 h-5 text-blue-600 mt-2"
                    />
                    <div className="flex-1 flex items-start gap-3">
                      <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700 flex-shrink-0">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <KaTeXEditor
                          value={option}
                          onChange={(value) => handleOptionChange(index, value)}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          rows={3}
                        />
                      </div>
                      {currentQuestion.options.length > 2 && (
                        <button
                          onClick={() => removeOption(index)}
                          className="p-2 text-gray-400 hover:text-red-600 flex-shrink-0"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentQuestion.answerType === 'written' && (
            <div>
              <MultipleAnswersEditor
                primaryAnswer={currentQuestion.writtenAnswer}
                onPrimaryAnswerChange={(value) => setCurrentQuestion(prev => ({ ...prev, writtenAnswer: value }))}
                acceptableAnswers={currentQuestion.acceptableAnswers || []}
                onAcceptableAnswersChange={(answers) => setCurrentQuestion(prev => ({ ...prev, acceptableAnswers: answers }))}
                placeholder="Enter the correct answer..."
                label="Correct Answer"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation
            </label>
            <KaTeXEditor
              value={currentQuestion.explanation}
              onChange={(value) => setCurrentQuestion(prev => ({ ...prev, explanation: value }))}
              placeholder="Explain the correct answer..."
              rows={3}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <MockTestDashboard />;
      case 'test-builder':
        return <MockTestBuilder />;
      case 'section-builder':
        return <MockSectionBuilder />;
      case 'question-builder':
        return <MockQuestionBuilder />;
      default:
        return <MockTestDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Mock Test Management</h1>
              <nav className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-1 rounded ${currentView === 'dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Dashboard
                </button>
                {currentView !== 'dashboard' && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-600 capitalize">{currentView.replace('-', ' ')}</span>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Total Mock Tests: {tests.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </div>
    </div>
  );
};

const Analytics = () => (
  <div className="py-6">
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      <p className="text-gray-600">View system analytics and reports</p>
    </div>
    <div className="card">
      <div className="card-header">
        <h2 className="text-lg font-semibold">System Analytics</h2>
      </div>
      <div className="card-body">
        <p className="text-gray-600">Analytics dashboard will be implemented here.</p>
        <p className="text-sm text-gray-500 mt-2">
          This will include features like user activity reports, test performance metrics, 
          system usage statistics, and other administrative insights.
        </p>
      </div>
    </div>
  </div>
);

const Admin = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/real-tests" element={<RealTestManagement />} />
      <Route path="/mock-tests" element={<MockTestManagement />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default Admin; 
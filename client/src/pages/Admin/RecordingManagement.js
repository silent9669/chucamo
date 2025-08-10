import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, Clock, BookOpen, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';

// Mock data for recordings
const mockRecordings = [
  {
    id: 1,
    title: 'SAT Reading Comprehension Strategies',
    type: 'reading-writing',
    duration: '45:30',
    uploadDate: '2024-01-15',
    instructor: 'Dr. Sarah Johnson',
    description: 'Learn effective strategies for tackling reading comprehension questions on the SAT.',
    thumbnail: '📚',
    views: 1247,
    status: 'published',
    category: 'Reading & Writing',
    fileSize: '125MB',
    tags: ['reading', 'comprehension', 'strategies']
  },
  {
    id: 2,
    title: 'Algebra Fundamentals Review',
    type: 'math',
    duration: '38:15',
    uploadDate: '2024-01-14',
    instructor: 'Prof. Michael Chen',
    description: 'Comprehensive review of essential algebra concepts for SAT Math section.',
    thumbnail: '📐',
    views: 892,
    status: 'published',
    category: 'Math',
    fileSize: '98MB',
    tags: ['algebra', 'fundamentals', 'review']
  },
  {
    id: 3,
    title: 'Essay Writing Techniques',
    type: 'reading-writing',
    duration: '52:20',
    uploadDate: '2024-01-13',
    instructor: 'Dr. Emily Rodriguez',
    description: 'Master the art of persuasive essay writing with proven techniques.',
    thumbnail: '✍️',
    views: 1563,
    status: 'draft',
    category: 'Reading & Writing',
    fileSize: '145MB',
    tags: ['essay', 'writing', 'techniques']
  },
  {
    id: 4,
    title: 'Geometry Problem Solving',
    type: 'math',
    duration: '41:45',
    uploadDate: '2024-01-12',
    instructor: 'Prof. David Kim',
    description: 'Advanced geometry problem-solving strategies and practice.',
    thumbnail: '🔺',
    views: 734,
    status: 'published',
    category: 'Math',
    fileSize: '112MB',
    tags: ['geometry', 'problem-solving', 'strategies']
  }
];

const RecordingManagement = () => {
  const [recordings, setRecordings] = useState([]);
  const [filteredRecordings, setFilteredRecordings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);

  const loadRecordings = useCallback(async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRecordings(mockRecordings);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading recordings:', error);
      toast.error('Failed to load recordings');
      setLoading(false);
    }
  }, []);

  const filterRecordings = useCallback(() => {
    let filtered = recordings;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(recording => recording.type === selectedType);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(recording => recording.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(recording =>
        recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRecordings(filtered);
  }, [recordings, searchTerm, selectedType, selectedStatus]);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  useEffect(() => {
    filterRecordings();
  }, [filterRecordings]);

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleEditClick = (recording) => {
    setSelectedRecording(recording);
    setShowEditModal(true);
  };

  const handleDeleteClick = (recording) => {
    if (window.confirm(`Are you sure you want to delete "${recording.title}"?`)) {
      // TODO: Implement delete functionality
      toast.success('Recording deleted successfully');
      setRecordings(recordings.filter(r => r.id !== recording.id));
    }
  };

  const handleStatusChange = (recording, newStatus) => {
    // TODO: Implement status change functionality
    const updatedRecordings = recordings.map(r => 
      r.id === recording.id ? { ...r, status: newStatus } : r
    );
    setRecordings(updatedRecordings);
    toast.success(`Status changed to ${newStatus}`);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'reading-writing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'math':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'reading-writing':
        return 'Reading & Writing';
      case 'math':
        return 'Math';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading recordings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recording Management</h1>
          <p className="text-gray-600">Manage educational recordings and uploaded lessons</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search recordings, instructors, or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter className="text-gray-500 w-5 h-5" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="reading-writing">Reading & Writing</option>
                <option value="math">Math</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Upload New Recording
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredRecordings.length} of {recordings.length} recordings
          </p>
        </div>

        {/* Recordings Table */}
        {filteredRecordings.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recording
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecordings.map((recording) => (
                    <tr key={recording.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                            {recording.thumbnail}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{recording.title}</div>
                            <div className="text-sm text-gray-500">{recording.description.substring(0, 60)}...</div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <Clock className="w-3 h-3" />
                              {recording.duration}
                              <span className="text-gray-300">•</span>
                              {recording.fileSize}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(recording.type)}`}>
                          {getTypeLabel(recording.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {recording.instructor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={recording.status}
                          onChange={(e) => handleStatusChange(recording, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(recording.status)} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="published">Published</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {recording.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(recording.uploadDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(recording)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(recording)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No recordings available at the moment'
              }
            </p>
            {searchTerm || selectedType !== 'all' || selectedStatus !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedStatus('all');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleUploadClick}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-5 h-5" />
                Upload First Recording
              </button>
            )}
          </div>
        )}

        {/* Upload Modal Placeholder */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Upload New Recording</h3>
              <p className="text-gray-600 mb-6">Upload functionality coming soon!</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    toast.info('Upload functionality will be implemented soon!');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal Placeholder */}
        {showEditModal && selectedRecording && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Recording</h3>
              <p className="text-gray-600 mb-6">Edit functionality coming soon!</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    toast.info('Edit functionality will be implemented soon!');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingManagement;

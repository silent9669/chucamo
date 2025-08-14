import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, BookOpen, Youtube, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';
import lessonAPI from '../../services/lessonAPI';
import LessonViewer from '../../components/UI/LessonViewer';

const Recording = () => {
  const [recordings, setRecordings] = useState([]);
  const [filteredRecordings, setFilteredRecordings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showLessonViewer, setShowLessonViewer] = useState(false);

  const loadRecordings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await lessonAPI.getLessons({ limit: 50 });
      setRecordings(response.data.docs || []);
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

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(recording =>
        recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recording.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRecordings(filtered);
  }, [recordings, searchTerm, selectedType]);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  useEffect(() => {
    filterRecordings();
  }, [filterRecordings]);

  const handleStartLearning = (lesson) => {
    setSelectedLesson(lesson);
    setShowLessonViewer(true);
  };

  const handleCloseLessonViewer = () => {
    setShowLessonViewer(false);
    setSelectedLesson(null);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recording Library</h1>
          <p className="text-gray-600">Access educational recordings</p>
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

            {/* Filter Type */}
            <div className="flex items-center gap-3">
              <Filter className="text-gray-500 w-5 h-5" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Records</option>
                <option value="reading-writing">Reading & Writing</option>
                <option value="math">Math</option>
                <option value="instruction">Instruction</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredRecordings.length} of {recordings.length} recordings
          </p>
        </div>

        {/* Lessons Display */}
        {filteredRecordings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecordings.map((lesson) => (
              <div
                key={lesson._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Lesson Header */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{lesson.thumbnail}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${
                          lesson.type === 'reading-writing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          lesson.type === 'math' ? 'bg-green-100 text-green-800 border-green-200' :
                          lesson.type === 'instruction' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {lesson.type === 'reading-writing' ? 'Reading & Writing' :
                           lesson.type === 'math' ? 'Math' :
                           lesson.type === 'instruction' ? 'Instruction' : 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {lesson.description}
                  </p>
                  
                  {/* Media Indicators */}
                  <div className="flex items-center gap-3">
                    {lesson.youtubeUrl && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <Youtube className="w-4 h-4" />
                        <span>Video</span>
                      </div>
                    )}
                    {lesson.pdfUrl && (
                      <div className="flex items-center gap-1 text-blue-600 text-sm">
                        <FileText className="w-4 h-4" />
                        <span>PDF</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Lesson Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(lesson.createdAt).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => handleStartLearning(lesson)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                    >
                      Start Learning →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings available</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No recordings available at the moment'
              }
            </p>
            {searchTerm || selectedType !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <p className="text-gray-500">Check back later for new content</p>
            )}
          </div>
        )}
      </div>

      {/* Lesson Viewer Modal */}
      <LessonViewer
        isOpen={showLessonViewer}
        onClose={handleCloseLessonViewer}
        lesson={selectedLesson}
      />
    </div>
  );
};

export default Recording;

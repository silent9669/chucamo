import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, BookOpen, Edit, Trash2, Youtube, FileText, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';
import lessonAPI from '../../services/lessonAPI';
import LessonCreator from '../../components/UI/LessonCreator';



const RecordingManagement = () => {
  const [lessons, setLessons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showLessonCreator, setShowLessonCreator] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLessons = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        type: selectedType !== 'all' ? selectedType : undefined,
        search: searchTerm.trim() || undefined
      };

      const response = await lessonAPI.getLessons(params);
      setLessons(response.data.docs || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading lessons:', error);
      toast.error('Failed to load lessons');
      setLoading(false);
    }
  }, [currentPage, selectedType, searchTerm]);

  const filterLessons = useCallback(() => {
    setCurrentPage(1);
    loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    filterLessons();
  }, [filterLessons]);

  const handleCreateLesson = () => {
    setEditingLesson(null);
    setShowLessonCreator(true);
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setShowLessonCreator(true);
  };

  const handleDeleteLesson = async (lesson) => {
    if (window.confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      try {
        await lessonAPI.deleteLesson(lesson._id);
        toast.success('Lesson deleted successfully');
        loadLessons();
      } catch (error) {
        toast.error('Failed to delete lesson');
      }
    }
  };

  const toggleLessonVisibility = async (lessonId, newVisibility) => {
    try {
      await lessonAPI.updateLesson(lessonId, { visibleTo: newVisibility });
      toast.success(`Lesson visibility updated to ${newVisibility === 'all' ? 'all users' : newVisibility} users`);
      loadLessons();
    } catch (error) {
      logger.error('Error toggling lesson visibility:', error);
      toast.error('Failed to update lesson visibility. Please try again.');
    }
  };

  const getVisibilityText = (visibility) => {
    if (!visibility || visibility.length === 0) return 'No Users';
    if (visibility.length === 3) return 'All Users';
    return visibility.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ');
  };

  const getVisibilityColor = (visibility) => {
    if (!visibility || visibility.length === 0) return 'bg-red-100 text-red-800 border-red-200';
    if (visibility.length === 3) return 'bg-green-100 text-green-800 border-green-200';
    if (visibility.length === 2) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };


  const handleLessonCreated = (lesson) => {
    loadLessons();
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
           <h1 className="text-3xl font-bold text-gray-900 mb-2">Lesson Management</h1>
           <p className="text-gray-600">Create and manage educational lessons with YouTube video and PDF support</p>
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
                  placeholder="Search lessons, instructors, or topics..."
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
                 <option value="instruction">Instruction</option>
               </select>
             </div>

            {/* Create Lesson Button */}
            <button
              onClick={handleCreateLesson}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Lesson
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {lessons.length} lessons (Page {currentPage} of {totalPages})
          </p>
        </div>

        {/* Lessons Table */}
        {lessons.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lesson
                    </th>
                                                                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lessons.map((lesson) => (
                    <tr key={lesson._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                            {lesson.thumbnail}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
                            <div className="text-sm text-gray-500">{lesson.description.substring(0, 60)}...</div>
                                                         <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                               {lesson.youtubeUrl && (
                                 <>
                                   <Youtube className="w-3 h-3 text-red-500" />
                                   Video
                                 </>
                               )}
                               {lesson.pdfUrl && (
                                 <>
                                   <span className="text-gray-300">•</span>
                                   <FileText className="w-3 h-3 text-blue-500" />
                                   PDF
                                 </>
                               )}
                             </div>
                          </div>
                        </div>
                      </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(lesson.type)}`}>
                           {getTypeLabel(lesson.type)}
                         </span>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getVisibilityColor(lesson.visibleTo || 'all')}`}>
                            {getVisibilityText(lesson.visibleTo || 'all')}
                          </span>
                          <button
                            onClick={() => {
                              const currentVisibility = lesson.visibleTo || ['free', 'student', 'pro'];
                              let newVisibility;
                              
                              // Cycle through different visibility combinations
                              if (currentVisibility.length === 3) {
                                // All users -> Only free users
                                newVisibility = ['free'];
                              } else if (currentVisibility.length === 1 && currentVisibility.includes('free')) {
                                // Only free -> Only student
                                newVisibility = ['student'];
                              } else if (currentVisibility.length === 1 && currentVisibility.includes('student')) {
                                // Only student -> Only pro
                                newVisibility = ['pro'];
                              } else if (currentVisibility.length === 1 && currentVisibility.includes('pro')) {
                                // Only pro -> Free + Student
                                newVisibility = ['free', 'student'];
                              } else if (currentVisibility.length === 2 && currentVisibility.includes('free') && currentVisibility.includes('student')) {
                                // Free + Student -> Free + Pro
                                newVisibility = ['free', 'pro'];
                              } else if (currentVisibility.length === 2 && currentVisibility.includes('free') && currentVisibility.includes('pro')) {
                                // Free + Pro -> Student + Pro
                                newVisibility = ['student', 'pro'];
                              } else {
                                // Student + Pro -> All users
                                newVisibility = ['free', 'student', 'pro'];
                              }
                              
                              toggleLessonVisibility(lesson._id, newVisibility);
                            }}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                            title="Change Visibility"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(lesson.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                 <div className="flex items-center gap-2">
                           <button
                             onClick={() => handleEditLesson(lesson)}
                             className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                             title="Edit"
                           >
                             <Edit className="w-4 h-4" />
                           </button>
                           <button
                             onClick={() => handleDeleteLesson(lesson)}
                             className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                             title="Delete"
                           >
                             <Trash2 className="w-4 h-4" />
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No lessons found</h3>
                         <p className="text-gray-600 mb-6">
               {searchTerm || selectedType !== 'all'
                 ? 'Try adjusting your search or filters'
                 : 'No lessons available at the moment'
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
              <button
                onClick={handleCreateLesson}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-5 h-5" />
                Create First Lesson
              </button>
            )}
          </div>
        )}

        {/* Lesson Creator Modal */}
        <LessonCreator
          isOpen={showLessonCreator}
          onClose={() => {
            setShowLessonCreator(false);
            setEditingLesson(null);
          }}
          onLessonCreated={handleLessonCreated}
          editingLesson={editingLesson}
        />
      </div>
    </div>
  );
};

export default RecordingManagement;

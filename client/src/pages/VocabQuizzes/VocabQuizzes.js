import React, { useState, useEffect, useCallback } from 'react';
import { Search, Play, Clock, BookOpen, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';
import vocabQuizAPI from '../../services/vocabQuizAPI';

const VocabQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await vocabQuizAPI.getAll();
      setQuizzes(response.data.quizzes || []);
      setFilteredQuizzes(response.data.quizzes || []);
    } catch (error) {
      logger.error('Error loading quizzes:', error);
      toast.error('Failed to load vocabulary quizzes');
      setQuizzes([]);
      setFilteredQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const filterQuizzes = useCallback(() => {
    let filtered = quizzes;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(quiz => quiz.difficulty === selectedDifficulty);
    }

    setFilteredQuizzes(filtered);
  }, [quizzes, searchTerm, selectedDifficulty]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    filterQuizzes();
  }, [filterQuizzes]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '🌱';
      case 'medium': return '🌿';
      case 'hard': return '🌳';
      default: return '📚';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading vocabulary quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Vocabulary Quizzes
          </h1>
          <p className="text-xl text-slate-600">
            Test your vocabulary knowledge with interactive quizzes
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search vocabulary quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Difficulty Filter */}
            <div className="lg:w-40">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-600">
            Showing {filteredQuizzes.length} of {quizzes.length} vocabulary quizzes
          </p>
        </div>

        {/* Quizzes Grid */}
        {filteredQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  {/* Quiz Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">
                        {quiz.title}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-3">
                        {quiz.description}
                      </p>
                    </div>
                  </div>

                  {/* Quiz Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                      <span className="mr-1">{getDifficultyIcon(quiz.difficulty)}</span>
                      {quiz.difficulty}
                    </span>
                    <div className="flex items-center text-slate-500 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {quiz.timeLimit || quiz.totalTime || 0}m
                    </div>
                  </div>

                  {/* Quiz Details */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-slate-600 text-sm">
                      <BookOpen className="w-4 h-4 mr-2" />
                      {quiz.totalQuestions || quiz.questionCount || 0} questions
                    </div>
                    {quiz.tags && quiz.tags.length > 0 && (
                      <div className="flex items-center text-slate-600 text-sm">
                        <Users className="w-4 h-4 mr-2" />
                        {quiz.tags.slice(0, 3).join(', ')}
                        {quiz.tags.length > 3 && ` +${quiz.tags.length - 3} more`}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={() => window.location.href = `/vocab-quizzes/${quiz._id}`}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <Play size={64} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              {quizzes.length === 0 ? 'No vocabulary quizzes available' : 'No quizzes match your search'}
            </h3>
            <p className="text-slate-500">
              {quizzes.length === 0 
                ? 'Check back later for new vocabulary quizzes'
                : 'Try adjusting your search terms or filters'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabQuizzes;

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';

const VocabQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await vocabQuizAPI.getQuizzes();
      
      // No sample data - empty array
      setQuizzes([]);
      setFilteredQuizzes([]);
    } catch (error) {
      logger.error('Error loading quizzes:', error);
      toast.error('Failed to load vocabulary quizzes');
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
        quiz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(quiz => quiz.difficulty === selectedDifficulty);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(quiz => quiz.status === selectedStatus);
    }

    setFilteredQuizzes(filtered);
  }, [quizzes, searchTerm, selectedDifficulty, selectedStatus]);

  useEffect(() => {
    loadQuizzes();
  }, []);

  useEffect(() => {
    filterQuizzes();
  }, [filterQuizzes]);

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

            {/* Status Filter */}
            <div className="lg:w-40">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
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

        {/* Empty State */}
        <div className="text-center py-12">
          <Play size={64} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">No vocabulary quizzes available</h3>
          <p className="text-slate-500">
            Check back later for new vocabulary quizzes
          </p>
        </div>
      </div>
    </div>
  );
};

export default VocabQuizzes;

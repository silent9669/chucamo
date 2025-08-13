import React, { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';
import vocabularyAPI from '../../services/vocabularyAPI';
import { useNavigate } from 'react-router-dom';

const VocabSets = () => {
  const [vocabSets, setVocabSets] = useState([]);
  const [filteredSets, setFilteredSets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const navigate = useNavigate();

  const loadVocabSets = async () => {
    try {
      setLoading(true);
      const response = await vocabularyAPI.getAllSets();
      setVocabSets(response.data.vocabSets);
      setFilteredSets(response.data.vocabSets);
    } catch (error) {
      logger.error('Error loading vocab sets:', error);
      toast.error('Failed to load vocabulary sets');
    } finally {
      setLoading(false);
    }
  };

  const filterVocabSets = useCallback(() => {
    let filtered = vocabSets;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(set => 
        set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        set.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        set.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(set => set.difficulty === selectedDifficulty);
    }

    setFilteredSets(filtered);
  }, [vocabSets, searchTerm, selectedDifficulty]);

  useEffect(() => {
    loadVocabSets();
  }, []);

  useEffect(() => {
    filterVocabSets();
  }, [filterVocabSets]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading vocabulary sets...</p>
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
            Daily Vocabulary Sets
          </h1>
          <p className="text-xl text-slate-600">
            Explore and learn from curated vocabulary collections
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
                placeholder="Search vocabulary sets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Difficulty Filter */}
            <div className="lg:w-48">
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
            Showing {filteredSets.length} of {vocabSets.length} vocabulary sets
          </p>
        </div>

        {/* Vocabulary Sets Grid */}
        {filteredSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSets.map((set) => (
              <div
                key={set._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/daily-vocab/study/${set._id}`)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {set.title}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      set.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      set.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {set.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 mb-4 line-clamp-2">{set.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <BookOpen size={16} />
                      <span>{set.wordCount} words</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-105">
                      <Play size={16} />
                      Start Learning
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen size={64} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No vocabulary sets available</h3>
            <p className="text-slate-500">
              Check back later for new vocabulary learning materials
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabSets;

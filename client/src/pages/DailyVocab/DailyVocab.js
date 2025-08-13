import React, { useState, useEffect } from 'react';
import { Book, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';
import vocabularyAPI from '../../services/vocabularyAPI';
import { useNavigate } from 'react-router-dom';

const DailyVocab = () => {
  const [loading, setLoading] = useState(true);
  const [vocabSets, setVocabSets] = useState([]);
  const navigate = useNavigate();

  const loadVocabEntries = async () => {
    setLoading(true);
    try {
      const response = await vocabularyAPI.getAllSets();
      setVocabSets(response.data.vocabSets);
    } catch (error) {
      logger.error('Error loading vocab entries:', error);
      toast.error('Failed to load vocabulary entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVocabEntries();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">
            Vocabulary
          </h2>
          <p className="text-lg text-slate-600 font-medium">
            Choose your vocabulary learning path
          </p>
        </div>

        {/* Vocabulary Sets Grid */}
        {vocabSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vocabSets.map((set) => (
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
                      <Book className="w-4 h-4" />
                      <span>{set.wordCount} words</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group-hover:scale-105">
                      <Play className="w-4 h-4" />
                      Start Learning
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Book className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vocabulary content available</h3>
            <p className="text-gray-600 mb-6">
              Check back later for new vocabulary learning materials
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyVocab;

import React, { useState, useEffect } from 'react';
import { Book, Target, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';

const DailyVocab = () => {
  const [loading, setLoading] = useState(true);

  const loadVocabEntries = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await vocabAPI.getAll();
      // setVocabEntries(response.data.vocabEntries);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
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

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Book className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vocabulary content available</h3>
          <p className="text-gray-600 mb-6">
            Check back later for new vocabulary learning materials
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyVocab;

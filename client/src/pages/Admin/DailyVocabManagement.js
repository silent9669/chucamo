import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiBookOpen, FiList } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';

const DailyVocabManagement = () => {
  const [vocabSets, setVocabSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSetModal, setShowSetModal] = useState(false);
  const [showWordModal, setShowWordModal] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [editingWord, setEditingWord] = useState(null);
  const [selectedSet, setSelectedSet] = useState(null);
  const [currentSet, setCurrentSet] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    date: new Date().toISOString().split('T')[0]
  });
  const [currentWord, setCurrentWord] = useState({
    word: '',
    definition: '',
    example: '',
    partOfSpeech: '',
    difficulty: 'medium'
  });

  const loadVocabSets = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await vocabAPI.getAllSets();
      // setVocabSets(response.data.vocabSets);
      
      // Mock data for now
      setVocabSets([
        {
          _id: '1',
          title: 'Basic SAT Vocabulary',
          description: 'Essential words for SAT preparation',
          difficulty: 'medium',
          date: '2024-01-15',
          wordCount: 20,
          isActive: true
        },
        {
          _id: '2',
          title: 'Advanced Academic Words',
          description: 'Complex vocabulary for advanced students',
          difficulty: 'hard',
          date: '2024-01-16',
          wordCount: 15,
          isActive: true
        }
      ]);
    } catch (error) {
      logger.error('Error loading vocab sets:', error);
      toast.error('Failed to load vocabulary sets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSet = () => {
    setEditingSet(null);
    setCurrentSet({
      title: '',
      description: '',
      difficulty: 'medium',
      date: new Date().toISOString().split('T')[0]
    });
    setShowSetModal(true);
  };

  const handleEditSet = (set) => {
    setEditingSet(set);
    setCurrentSet({
      title: set.title,
      description: set.description,
      difficulty: set.difficulty,
      date: set.date
    });
    setShowSetModal(true);
  };

  const handleDeleteSet = async (setId) => {
    if (window.confirm('Are you sure you want to delete this vocabulary set? This will also delete all words in the set.')) {
      try {
        // TODO: Replace with actual API call
        // await vocabAPI.deleteSet(setId);
        
        setVocabSets(prev => prev.filter(set => set._id !== setId));
        if (selectedSet && selectedSet._id === setId) {
          setSelectedSet(null);
        }
        toast.success('Vocabulary set deleted successfully');
      } catch (error) {
        logger.error('Error deleting vocab set:', error);
        toast.error('Failed to delete vocabulary set');
      }
    }
  };

  const handleSaveSet = async () => {
    try {
      if (!currentSet.title || !currentSet.description) {
        toast.error('Title and description are required');
        return;
      }

      if (editingSet) {
        // TODO: Replace with actual API call
        // const response = await vocabAPI.updateSet(editingSet._id, currentSet);
        // setVocabSets(prev => prev.map(set => 
        //   set._id === editingSet._id ? response.data.vocabSet : set
        // ));
        
        setVocabSets(prev => prev.map(set => 
          set._id === editingSet._id ? { ...set, ...currentSet } : set
        ));
        toast.success('Vocabulary set updated successfully');
      } else {
        // TODO: Replace with actual API call
        // const response = await vocabAPI.createSet(currentSet);
        // setVocabSets(prev => [...prev, response.data.vocabSet]);
        
        const newSet = {
          _id: Date.now().toString(),
          ...currentSet,
          wordCount: 0,
          isActive: true
        };
        setVocabSets(prev => [...prev, newSet]);
        toast.success('Vocabulary set created successfully');
      }
      
      setShowSetModal(false);
    } catch (error) {
      logger.error('Error saving vocab set:', error);
      toast.error('Failed to save vocabulary set');
    }
  };

  const handleCreateWord = () => {
    if (!selectedSet) {
      toast.error('Please select a vocabulary set first');
      return;
    }
    setEditingWord(null);
    setCurrentWord({
      word: '',
      definition: '',
      example: '',
      partOfSpeech: '',
      difficulty: 'medium'
    });
    setShowWordModal(true);
  };



  const handleSaveWord = async () => {
    try {
      if (!currentWord.word || !currentWord.definition) {
        toast.error('Word and definition are required');
        return;
      }

      if (editingWord) {
        // TODO: Replace with actual API call
        // const response = await vocabAPI.updateWord(editingWord._id, currentWord);
        // Update the word in the selected set
        toast.success('Word updated successfully');
      } else {
        // TODO: Replace with actual API call
        // const response = await vocabAPI.createWord(selectedSet._id, currentWord);
        // Add the word to the selected set
        
        // Update the selected set's word count
        if (selectedSet) {
          setSelectedSet(prev => ({
            ...prev,
            wordCount: prev.wordCount + 1
          }));
        }
        toast.success('Word added successfully');
      }
      
      setShowWordModal(false);
    } catch (error) {
      logger.error('Error saving word:', error);
      toast.error('Failed to save word');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    loadVocabSets();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Vocabulary Management</h1>
          <p className="text-gray-600">Create and manage vocabulary sets for daily learning</p>
        </div>
        <button
          onClick={handleCreateSet}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          Create Vocabulary Set
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vocabulary Sets List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Vocabulary Sets</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {vocabSets.map((set) => (
                <div 
                  key={set._id} 
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedSet?._id === set._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSet(set)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{set.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{set.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(set.difficulty)}`}>
                          {set.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">{set.wordCount} words</span>
                        <span className="text-xs text-gray-500">{new Date(set.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSet(set);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSet(set._id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Set Details and Words */}
        <div className="lg:col-span-2">
          {selectedSet ? (
            <div className="space-y-6">
              {/* Set Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedSet.title}</h2>
                    <p className="text-gray-600 mt-1">{selectedSet.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(selectedSet.difficulty)}`}>
                        {selectedSet.difficulty}
                      </span>
                      <span className="text-xs text-gray-500">{selectedSet.wordCount} words</span>
                      <span className="text-xs text-gray-500">{new Date(selectedSet.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleCreateWord}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FiPlus className="mr-2" />
                    Add Word
                  </button>
                </div>
              </div>

              {/* Words List */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Words in Set</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {/* TODO: Replace with actual words from the selected set */}
                  <div className="p-4 text-center text-gray-500">
                    <FiList className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No words added yet. Click "Add Word" to get started.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FiBookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Vocabulary Set</h3>
              <p className="text-gray-600">Choose a vocabulary set from the left to view and manage its words.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Set Modal */}
      {showSetModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingSet ? 'Edit Vocabulary Set' : 'Create Vocabulary Set'}
                </h3>
                <button
                  onClick={() => setShowSetModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={currentSet.title}
                    onChange={(e) => setCurrentSet(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter set title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={currentSet.description}
                    onChange={(e) => setCurrentSet(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter set description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={currentSet.difficulty}
                    onChange={(e) => setCurrentSet(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={currentSet.date}
                    onChange={(e) => setCurrentSet(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSetModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSet}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSave className="mr-2" />
                  {editingSet ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Word Modal */}
      {showWordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingWord ? 'Edit Word' : 'Add Word'}
                </h3>
                <button
                  onClick={() => setShowWordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Word *
                  </label>
                  <input
                    type="text"
                    value={currentWord.word}
                    onChange={(e) => setCurrentWord(prev => ({ ...prev, word: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter word"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Definition *
                  </label>
                  <textarea
                    value={currentWord.definition}
                    onChange={(e) => setCurrentWord(prev => ({ ...prev, definition: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter definition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Example
                  </label>
                  <textarea
                    value={currentWord.example}
                    onChange={(e) => setCurrentWord(prev => ({ ...prev, example: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter example sentence"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Part of Speech
                  </label>
                  <select
                    value={currentWord.partOfSpeech}
                    onChange={(e) => setCurrentWord(prev => ({ ...prev, partOfSpeech: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select part of speech</option>
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adjective">Adjective</option>
                    <option value="adverb">Adverb</option>
                    <option value="pronoun">Pronoun</option>
                    <option value="preposition">Preposition</option>
                    <option value="conjunction">Conjunction</option>
                    <option value="interjection">Interjection</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={currentWord.difficulty}
                    onChange={(e) => setCurrentWord(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowWordModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWord}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiSave className="mr-2" />
                  {editingWord ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyVocabManagement;

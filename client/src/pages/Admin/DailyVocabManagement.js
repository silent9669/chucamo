import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';

const DailyVocabManagement = () => {
  const [vocabEntries, setVocabEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentEntry, setCurrentEntry] = useState({
    word: '',
    definition: '',
    example: '',
    partOfSpeech: '',
    difficulty: 'medium',
    date: new Date().toISOString().split('T')[0]
  });

  const loadVocabEntries = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await vocabAPI.getAll();
      // setVocabEntries(response.data.vocabEntries);
      
      // No mock data - empty array for now
      setVocabEntries([]);
    } catch (error) {
      logger.error('Error loading vocab entries:', error);
      toast.error('Failed to load vocabulary entries');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setCurrentEntry({
      word: '',
      definition: '',
      example: '',
      partOfSpeech: '',
      difficulty: 'medium',
      date: new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setCurrentEntry({
      word: entry.word,
      definition: entry.definition,
      example: entry.example,
      partOfSpeech: entry.partOfSpeech,
      difficulty: entry.difficulty,
      date: entry.date
    });
    setShowModal(true);
  };

  const handleDelete = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this vocabulary entry?')) {
      try {
        // TODO: Replace with actual API call
        // await vocabAPI.delete(entryId);
        
        setVocabEntries(prev => prev.filter(entry => entry._id !== entryId));
        toast.success('Vocabulary entry deleted successfully');
      } catch (error) {
        logger.error('Error deleting vocab entry:', error);
        toast.error('Failed to delete vocabulary entry');
      }
    }
  };

  const handleSave = async () => {
    try {
      if (!currentEntry.word || !currentEntry.definition) {
        toast.error('Word and definition are required');
        return;
      }

      if (editingEntry) {
        // TODO: Replace with actual API call
        // const response = await vocabAPI.update(editingEntry._id, currentEntry);
        // setVocabEntries(prev => prev.map(entry => 
        //   entry._id === editingEntry._id ? response.data.vocabEntry : entry
        // ));
        
        setVocabEntries(prev => prev.map(entry => 
          entry._id === editingEntry._id ? { ...entry, ...currentEntry } : entry
        ));
        toast.success('Vocabulary entry updated successfully');
      } else {
        // TODO: Replace with actual API call
        // const response = await vocabAPI.create(currentEntry);
        // setVocabEntries(prev => [...prev, response.data.vocabEntry]);
        
        const newEntry = {
          _id: Date.now().toString(),
          ...currentEntry,
          isActive: true
        };
        setVocabEntries(prev => [...prev, newEntry]);
        toast.success('Vocabulary entry created successfully');
      }
      
      setShowModal(false);
    } catch (error) {
      logger.error('Error saving vocab entry:', error);
      toast.error('Failed to save vocabulary entry');
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
    loadVocabEntries();
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
          <p className="text-gray-600">Create and manage daily vocabulary entries for students</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Vocabulary
        </button>
      </div>

      {/* Vocabulary Entries List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Word
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Definition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part of Speech
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vocabEntries.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.word}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{entry.definition}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{entry.partOfSpeech}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(entry.difficulty)}`}>
                      {entry.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <FiCalendar className="mr-1" />
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingEntry ? 'Edit Vocabulary' : 'Add Vocabulary'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
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
                    value={currentEntry.word}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, word: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter word"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Definition *
                  </label>
                  <textarea
                    value={currentEntry.definition}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, definition: e.target.value }))}
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
                    value={currentEntry.example}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, example: e.target.value }))}
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
                    value={currentEntry.partOfSpeech}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, partOfSpeech: e.target.value }))}
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
                    value={currentEntry.difficulty}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, difficulty: e.target.value }))}
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
                    value={currentEntry.date}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSave className="mr-2" />
                  {editingEntry ? 'Update' : 'Create'}
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

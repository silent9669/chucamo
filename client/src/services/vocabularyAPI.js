import api from './api';

const vocabularyAPI = {
  // Get all vocabulary sets
  getAllSets: () => api.get('/vocabulary/sets'),
  
  // Get vocabulary set by ID
  getSetById: (id) => api.get(`/vocabulary/sets/${id}`),
  
  // Create new vocabulary set (Admin only)
  createSet: (setData) => api.post('/vocabulary/sets', setData),
  
  // Update vocabulary set (Admin only)
  updateSet: (id, setData) => api.put(`/vocabulary/sets/${id}`, setData),
  
  // Delete vocabulary set (Admin only)
  deleteSet: (id) => api.delete(`/vocabulary/sets/${id}`),
  
  // Add word to vocabulary set (Admin only)
  addWord: (setId, wordData) => api.post(`/vocabulary/sets/${setId}/words`, wordData),
  
  // Update word in vocabulary set (Admin only)
  updateWord: (setId, wordId, wordData) => api.put(`/vocabulary/sets/${setId}/words/${wordId}`, wordData),
  
  // Delete word from vocabulary set (Admin only)
  deleteWord: (setId, wordId) => api.delete(`/vocabulary/sets/${setId}/words/${wordId}`),
  
  // Get all vocabulary sets for admin management
  getAdminSets: () => api.get('/vocabulary/admin/sets'),
};

export default vocabularyAPI;

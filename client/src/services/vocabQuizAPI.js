import api from './api';

const vocabQuizAPI = {
  // Get all vocabulary quizzes (public)
  getAll: () => api.get('/vocab-quizzes'),
  
  // Get vocabulary quiz by ID
  getById: (id) => api.get(`/vocab-quizzes/${id}`),
  
  // Get all vocabulary quizzes for admin management
  getAllForAdmin: () => api.get('/vocab-quizzes/admin/all'),
  
  // Create new vocabulary quiz (Admin only)
  create: (quizData) => api.post('/vocab-quizzes', quizData),
  
  // Update vocabulary quiz (Admin only)
  update: (id, quizData) => api.put(`/vocab-quizzes/${id}`, quizData),
  
  // Delete vocabulary quiz (Admin only)
  delete: (id) => api.delete(`/vocab-quizzes/${id}`),
  
  // Toggle quiz active status (Admin only)
  toggleActive: (id) => api.patch(`/vocab-quizzes/${id}/toggle-active`),
  
  // Duplicate vocabulary quiz (Admin only)
  duplicate: (id) => api.post(`/vocab-quizzes/${id}/duplicate`),
};

export default vocabQuizAPI;

import api from './api';

export const lessonAPI = {
  // Get all lessons with filtering and pagination
  getLessons: async (params = {}) => {
    try {
      const response = await api.get('/lessons', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  },

  // Get lesson by ID
  getLesson: async (id) => {
    try {
      const response = await api.get(`/lessons/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }
  },

  // Create new lesson
  createLesson: async (lessonData) => {
    try {
      const response = await api.post('/lessons', lessonData);
      return response.data;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  },

  // Update lesson
  updateLesson: async (id, lessonData) => {
    try {
      const response = await api.put(`/lessons/${id}`, lessonData);
      return response.data;
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  },

  // Delete lesson
  deleteLesson: async (id) => {
    try {
      const response = await api.delete(`/lessons/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  },

  // Update lesson status
  updateLessonStatus: async (id, status) => {
    try {
      const response = await api.patch(`/lessons/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating lesson status:', error);
      throw error;
    }
  },

  // Increment lesson views
  incrementLessonViews: async (id) => {
    try {
      const response = await api.patch(`/lessons/${id}/view`);
      return response.data;
    } catch (error) {
      console.error('Error incrementing lesson views:', error);
      throw error;
    }
  }
};

export default lessonAPI;

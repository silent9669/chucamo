import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://abc-xyz-production.up.railway.app/api' : '/api'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (userData) => api.post('/auth/register', userData),
  googleLogin: (googleData) => api.post('/auth/google', googleData),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  setAuthToken: (token) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  removeAuthToken: () => {
    delete api.defaults.headers.common['Authorization'];
  },
};

// Tests API
export const testsAPI = {
  getAll: (params) => api.get('/tests', { params }),
  getById: (id) => api.get(`/tests/${id}`),
  create: (testData) => api.post('/tests', testData),
  update: (id, testData) => api.put(`/tests/${id}`, testData),
  delete: (id) => api.delete(`/tests/${id}`),
  getQuestions: (id) => api.get(`/tests/${id}/questions`),
  duplicate: (id) => api.post(`/tests/${id}/duplicate`),
  createQuestion: (sectionId, questionData) => api.post(`/sections/${sectionId}/questions`, questionData),
  updateQuestion: (questionId, questionData) => api.put(`/questions/${questionId}`, questionData),
  getTestHistory: () => api.get('/tests/history'),
  getTestResults: (testId) => api.get(`/tests/${testId}/results`),
};

// Questions API
export const questionsAPI = {
  getAll: (params) => api.get('/questions', { params }),
  getById: (id) => api.get(`/questions/${id}`),
  create: (questionData) => api.post('/questions', questionData),
  update: (id, questionData) => api.put(`/questions/${id}`, questionData),
  delete: (id) => api.delete(`/questions/${id}`),
};

// Results API
export const resultsAPI = {
  getAll: (params) => api.get('/results', { params }),
  getById: (id) => api.get(`/results/${id}`),
  startTest: (testId) => api.post('/results', { testId }),
  submitTest: (id, data) => api.put(`/results/${id}`, data),
  getAnalytics: () => api.get('/results/analytics/overview'),
  addReview: (id, reviewNotes) => api.put(`/results/${id}/review`, { reviewNotes }),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getProfile: () => api.get('/users/profile'),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/upload/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadQuestionImage: (file) => {
    const formData = new FormData();
    formData.append('questionImage', file);
    return api.post('/upload/question-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadTestImage: (file) => {
    const formData = new FormData();
    formData.append('testImage', file);
    return api.post('/upload/test-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteFile: (filename) => api.delete(`/upload/${filename}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api; 
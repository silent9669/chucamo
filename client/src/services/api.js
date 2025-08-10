import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: (() => {
    // Check for environment-specific API URL first
    const envUrl = process.env.REACT_APP_API_URL;
    
    if (envUrl) {
      // Ensure the URL has the correct protocol
      if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
        return envUrl;
      } else {
        return `https://${envUrl}`;
      }
    }
    
    // Production fallback - check multiple possible Railway URLs
    if (process.env.NODE_ENV === 'production') {
      // Try to get the current hostname and use it for the API
      const currentHost = window.location.hostname;
      if (currentHost && currentHost !== 'localhost') {
        return `https://${currentHost}/api`;
      }
      
      // Fallback to known Railway URL
      return 'https://chucamo-production.up.railway.app/api';
    }
    
    // Development fallback - use proxy
    return '/api';
  })(),
  timeout: 30000, // Increased timeout for test loading
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
    
    // Log request details for debugging
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      hasToken: !!token,
      environment: process.env.NODE_ENV,
      currentHost: window.location.hostname
    });
    
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
    // Log detailed error information for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code,
      environment: process.env.NODE_ENV,
      currentHost: window.location.hostname
    });
    
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

// Articles API
export const articlesAPI = {
  getAll: (params) => api.get('/articles', { params }),
  getById: (id) => api.get(`/articles/${id}`),
  create: (articleData) => api.post('/articles', articleData),
  update: (id, articleData) => api.put(`/articles/${id}`, articleData),
  delete: (id) => api.delete(`/articles/${id}`),
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
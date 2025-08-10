import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Tests from './pages/Tests/Tests';
import TestDetail from './pages/Tests/TestDetail';
import TestTaker from './pages/Tests/TestTaker';
import Results from './pages/Results/Results';
import ResultDetail from './pages/Results/ResultDetail';
import TestDetails from './pages/TestDetails/TestDetails';
import Profile from './pages/Profile/Profile';
import Articles from './pages/Articles/Articles';
import ArticleReader from './pages/Articles/ArticleReader';
import ArticlesManagement from './pages/Articles/ArticlesManagement';
import Admin from './pages/Admin/Admin';
import SATScoreCalculator from './pages/SATScoreCalculator';
import StudyPlan from './pages/StudyPlan/StudyPlan';
import DailyVocab from './pages/DailyVocab/DailyVocab';
import UpgradePlan from './pages/UpgradePlan/UpgradePlan';

// Protected Route Component
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirects if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/study-plan"
        element={
          <ProtectedRoute>
            <Layout>
              <StudyPlan />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/daily-vocab"
        element={
          <ProtectedRoute>
            <Layout>
              <DailyVocab />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tests"
        element={
          <ProtectedRoute>
            <Layout>
              <Tests />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tests/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <TestDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tests/:id/take"
        element={
          <ProtectedRoute>
            <TestTaker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/test-taker"
        element={
          <ProtectedRoute>
            <TestTaker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <Layout>
              <Articles />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/library/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ArticleReader />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/library-management"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <ArticlesManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <Layout>
              <Results />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/results/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <ResultDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/test-details/:id"
        element={
          <ProtectedRoute>
            <TestDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />



      <Route
        path="/sat-score-calculator"
        element={
          <ProtectedRoute>
            <Layout>
              <SATScoreCalculator />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/upgrade-plan"
        element={
          <ProtectedRoute>
            <UpgradePlan />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <Admin />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App; 
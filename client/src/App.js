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
import StudyPlan from './pages/StudyPlan/StudyPlan';
import StudyPlanManagement from './pages/StudyPlanManagement/StudyPlanManagement';
import Admin from './pages/Admin/Admin';
import SATScoreCalculator from './pages/SATScoreCalculator';

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
        path="/study-plan-management"
        element={
          <ProtectedRoute roles={['admin']}>
            <Layout>
              <StudyPlanManagement />
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
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/UI/LoadingSpinner';
import ErrorBoundary from './components/UI/ErrorBoundary';

// Pages
import Login from './pages/Auth/Login';
import OAuthCallback from './pages/Auth/OAuthCallback';
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
import VocabSets from './pages/VocabSets/VocabSets';
import VocabQuizzes from './pages/VocabQuizzes/VocabQuizzes';
import VocabQuizTaker from './pages/VocabQuizzes/VocabQuizTaker';
import VocabularyStudy from './components/VocabularyStudy';
import PlanFuture from './pages/PlanFuture/PlanFuture';
import PetHouse from './pages/PetHouse/PetHouse';
import Recording from './pages/Recording/Recording';
import UpgradePlan from './pages/UpgradePlan/UpgradePlan';
import HighlightingTest from './components/UI/HighlightingTest';

// Protected Route Component
const ProtectedRoute = ({ children, roles = [], restrictedAccountTypes = [] }) => {
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

  // Check if user's account type is restricted
  if (restrictedAccountTypes.length > 0 && user.accountType && restrictedAccountTypes.includes(user.accountType)) {
    return <Navigate to="/upgrade-plan" replace />;
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
        path="/oauth-callback" 
        element={
          <PublicRoute>
            <OAuthCallback />
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
          <ProtectedRoute restrictedAccountTypes={['free', 'pro']}>
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
        path="/vocab-sets"
        element={
          <ProtectedRoute>
            <Layout>
              <VocabSets />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/daily-vocab/study/:setId"
        element={
          <ProtectedRoute>
            <VocabularyStudy />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vocab-quizzes"
        element={
          <ProtectedRoute>
            <Layout>
              <VocabQuizzes />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vocab-quizzes/:id"
        element={
          <ProtectedRoute>
            <VocabQuizTaker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/plan-future"
        element={
          <ProtectedRoute>
            <Layout>
              <PlanFuture />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pet-house"
        element={
          <ProtectedRoute>
            <Layout>
              <PetHouse />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/recording"
        element={
          <ProtectedRoute>
            <Layout>
              <Recording />
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
            <Layout>
              <UpgradePlan />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/highlighting-test"
        element={
          <ProtectedRoute>
            <Layout>
              <HighlightingTest />
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
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 
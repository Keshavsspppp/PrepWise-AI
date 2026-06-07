import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadNotes from './pages/UploadNotes';
import NotesList from './pages/NotesList';
import AskAI from './pages/AskAI';
import QuizGenerator from './pages/QuizGenerator';
import QuizAttempt from './pages/QuizAttempt';
import QuizResult from './pages/QuizResult';
import QuizHistory from './pages/QuizHistory';
import LearningDNA from './pages/LearningDNA';
import RevisionDashboard from './pages/RevisionDashboard';
import RevisionHistory from './pages/RevisionHistory';
import ExamReadiness from './pages/ExamReadiness';
import MockViva from './pages/MockViva';
import VivaSession from './pages/VivaSession';
import VivaResults from './pages/VivaResults';
import VivaHistory from './pages/VivaHistory';
import './App.css';

// Public routes wrapper to redirect logged-in users away from auth pages
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Let the ProtectedRoute handle showing the spinner, or return blank to prevent flicker
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Auth/Public routes */}
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

      {/* Protected Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/upload"
        element={
          <ProtectedRoute>
            <UploadNotes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/list"
        element={
          <ProtectedRoute>
            <NotesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai/ask"
        element={
          <ProtectedRoute>
            <AskAI />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/generator"
        element={
          <ProtectedRoute>
            <QuizGenerator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/attempt/:id"
        element={
          <ProtectedRoute>
            <QuizAttempt />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/result"
        element={
          <ProtectedRoute>
            <QuizResult />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz/history"
        element={
          <ProtectedRoute>
            <QuizHistory />
          </ProtectedRoute>
        }
      />

      {/* Learning DNA Route */}
      <Route
        path="/dna"
        element={
          <ProtectedRoute>
            <LearningDNA />
          </ProtectedRoute>
        }
      />

      {/* Revision Engine Routes */}
      <Route
        path="/revision"
        element={
          <ProtectedRoute>
            <RevisionDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/revision/history"
        element={
          <ProtectedRoute>
            <RevisionHistory />
          </ProtectedRoute>
        }
      />

      {/* Exam Readiness Route */}
      <Route path="/readiness" element={<ProtectedRoute><ExamReadiness /></ProtectedRoute>} />

      {/* Mock Viva Routes */}
      <Route path="/viva" element={<ProtectedRoute><MockViva /></ProtectedRoute>} />
      <Route path="/viva/session" element={<ProtectedRoute><VivaSession /></ProtectedRoute>} />
      <Route path="/viva/results" element={<ProtectedRoute><VivaResults /></ProtectedRoute>} />
      <Route path="/viva/history" element={<ProtectedRoute><VivaHistory /></ProtectedRoute>} />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;

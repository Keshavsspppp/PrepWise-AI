import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Sparkles } from 'lucide-react';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NotesList = lazy(() => import('./pages/NotesList'));
const AskAI = lazy(() => import('./pages/AskAI'));
const QuizGenerator = lazy(() => import('./pages/QuizGenerator'));
const QuizAttempt = lazy(() => import('./pages/QuizAttempt'));
const QuizResult = lazy(() => import('./pages/QuizResult'));
const QuizHistory = lazy(() => import('./pages/QuizHistory'));
const LearningDNA = lazy(() => import('./pages/LearningDNA'));
const MockViva = lazy(() => import('./pages/MockViva'));
const VivaSession = lazy(() => import('./pages/VivaSession'));
const VivaResults = lazy(() => import('./pages/VivaResults'));
const VivaHistory = lazy(() => import('./pages/VivaHistory'));
import './App.css';
// Public routes wrapper to redirect logged-in users away from auth pages
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          {/* Animated pulsing outer rings */}
          <div className="absolute h-16 w-16 rounded-full border-2 border-brand-500/20 animate-ping"></div>
          <div className="absolute h-12 w-12 rounded-full border-2 border-indigo-500/30 animate-pulse"></div>
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/25">
            <Sparkles className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>
        <p className="text-xs font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase animate-pulse">
          Loading Session...
        </p>
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
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
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
      <Route path="/notes/upload" element={<Navigate to="/notes/list?upload=true" replace />} />
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
        path="/quiz/result/:resultId"
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
      {/* Mastery & Insights Tabbed Dashboard */}
      <Route
        path="/dna"
        element={
          <ProtectedRoute>
            <LearningDNA />
          </ProtectedRoute>
        }
      />
      {/* Redirect old routes to the tabbed Mastery & Insights view */}
      <Route path="/revision" element={<Navigate to="/dna?tab=revision" replace />} />
      <Route path="/revision/history" element={<Navigate to="/dna?tab=revision&sub=history" replace />} />
      <Route path="/readiness" element={<Navigate to="/dna?tab=readiness" replace />} />
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
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center space-y-4">
    <div className="relative flex items-center justify-center">
      {/* Animated pulsing outer rings */}
      <div className="absolute h-16 w-16 rounded-full border-2 border-brand-500/20 animate-ping"></div>
      <div className="absolute h-12 w-12 rounded-full border-2 border-indigo-500/30 animate-pulse"></div>
      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/25">
        <Sparkles className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
      </div>
    </div>
    <p className="text-xs font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase animate-pulse">
      Loading Page...
    </p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <AppRoutes />
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
export default App;
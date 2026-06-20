import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';
const ProtectedRoute = ({ children }) => {
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
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
export default ProtectedRoute;
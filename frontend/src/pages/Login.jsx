import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    setLoading(false);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6 font-sans text-text-primary">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-dark-card border border-slate-800/40 rounded-3xl shadow-xl shadow-black/40 p-8 md:p-10 relative z-10 transition-all duration-300 hover:border-slate-800/80">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center space-y-3 pb-8 text-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-neon-gradient text-white shadow-lg shadow-primary/25">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display font-extrabold text-2xl text-text-primary tracking-tight">
              Welcome Back
            </h2>
            <p className="text-sm text-text-secondary">
              Sign in to access your AI study companion
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@studygenie.ai"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-sm focus:outline-hidden focus:border-primary focus:bg-slate-900/85 transition-all duration-200 text-text-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Password
              </label>
              <a href="#" className="text-xs text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-sm focus:outline-hidden focus:border-primary focus:bg-slate-900/85 transition-all duration-200 text-text-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-neon-gradient hover:opacity-95 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md shadow-primary/15 active:scale-98 cursor-pointer disabled:opacity-50 glow-button"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Signup Link */}
        <div className="pt-8 border-t border-slate-800/40 text-center text-xs text-text-secondary">
          New to StudyGenie?{' '}
          <a href="#/register" className="text-primary hover:underline font-semibold">
            Create an account
          </a>
        </div>

      </div>
    </div>
  );
};

export default Login;

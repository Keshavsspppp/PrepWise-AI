import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import VivaSummary from '../components/VivaSummary';
import { ArrowLeft, RotateCcw, History, Loader2 } from 'lucide-react';

const VivaResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  const [results, setResults] = useState(state?.results || null);
  const [loading, setLoading] = useState(!results && !!state?.vivaId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!results && state?.vivaId) {
      API.get(`/viva/results/${state.vivaId}`)
        .then(res => setResults(res.data))
        .catch(err => setError(err.response?.data?.detail || 'Failed to load results.'))
        .finally(() => setLoading(false));
    } else if (!results && !state?.vivaId) {
      navigate('/viva');
    }
  }, []);

  if (loading) return (
    <DashboardLayout currentPage="Viva Results">
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout currentPage="Viva Results">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/viva')}
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-all cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-display font-bold text-text-primary">Viva Results</h1>
              <p className="text-xs text-slate-500">{results?.subject} · {results?.difficulty}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/viva/history')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer">
              <History className="h-3.5 w-3.5" /> History
            </button>
            <button onClick={() => navigate('/viva')}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold rounded-xl cursor-pointer">
              <RotateCcw className="h-3.5 w-3.5" /> Retake
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4 text-red-300 text-sm">{error}</div>}

        {results && <VivaSummary {...results} />}
      </div>
    </DashboardLayout>
  );
};

export default VivaResults;

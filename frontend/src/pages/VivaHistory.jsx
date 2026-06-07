import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { History, ArrowLeft, Mic, RotateCcw, BarChart3, Search, Calendar, Star, Loader2 } from 'lucide-react';

const GRADE_COLORS = {
  'Distinction':        'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Merit':              'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Pass':               'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Needs Improvement':  'bg-red-500/15 text-red-400 border-red-500/20',
};

const getGrade = (avg) => {
  if (avg === null || avg === undefined) return 'Pending';
  if (avg >= 8.5) return 'Distinction';
  if (avg >= 7.0) return 'Merit';
  if (avg >= 5.0) return 'Pass';
  return 'Needs Improvement';
};

const Sk = () => <div className="animate-pulse bg-slate-800/50 rounded-2xl h-20 w-full" />;

const VivaHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/viva/history')
      .then(res => setHistory(res.data || []))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load viva history.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(h =>
    h.subject.toLowerCase().includes(search.toLowerCase()) ||
    h.difficulty.toLowerCase().includes(search.toLowerCase())
  );

  const avgScore = history.filter(h => h.avg_score !== null).length
    ? (history.reduce((s, h) => s + (h.avg_score || 0), 0) / history.filter(h => h.avg_score !== null).length).toFixed(1)
    : '—';

  return (
    <DashboardLayout currentPage="Viva History">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/viva')}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            <div>
              <h1 className="text-xl font-display font-bold text-text-primary">Viva History</h1>
              <p className="text-xs text-slate-500">All your completed mock viva sessions</p>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/viva')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold rounded-xl cursor-pointer">
          <Mic className="h-3.5 w-3.5" /> New Viva
        </button>
      </div>

      {/* Summary */}
      {!loading && history.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-white">{history.length}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Sessions</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-cyan-400">{avgScore}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Avg Score/Q</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-white">{new Set(history.map(h => h.subject)).size}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Subjects</p>
          </div>
        </div>
      )}

      {/* Search */}
      {!loading && history.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by subject or difficulty..."
            className="w-full bg-slate-900/40 border border-slate-800/70 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 transition-colors" />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Sk key={i} />)}</div>
      ) : error ? (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center text-center">
          <Mic className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-400 mb-2">{history.length === 0 ? 'No Viva Sessions Yet' : 'No results found'}</h3>
          <p className="text-sm text-slate-600 mb-5">
            {history.length === 0 ? 'Start your first AI Mock Viva to see it here.' : `No sessions match "${search}".`}
          </p>
          {history.length === 0 && (
            <button onClick={() => navigate('/viva')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-sm font-bold rounded-xl cursor-pointer">
              <Mic className="h-4 w-4" /> Start First Viva
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(session => {
            const grade = getGrade(session.avg_score);
            const gradeCls = GRADE_COLORS[grade] || 'bg-slate-800/40 text-slate-400 border-slate-700/40';
            const pct = session.avg_score !== null ? Math.round(session.avg_score * 10) : null;
            return (
              <div key={session.viva_id}
                className="flex items-center gap-4 bg-slate-900/30 border border-slate-800/60 hover:border-slate-700/60 rounded-2xl px-5 py-4 transition-all cursor-pointer"
                onClick={() => navigate('/viva/results', { state: { vivaId: session.viva_id } })}>
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <Mic className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{session.subject}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${gradeCls}`}>{grade}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(session.started_at).toLocaleDateString()}</span>
                    <span>{session.difficulty}</span>
                    <span>{session.question_count} Qs</span>
                  </div>
                </div>
                {pct !== null && (
                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-extrabold text-white">{pct}%</p>
                    <p className="text-[9px] text-slate-500">{session.avg_score}/10 avg</p>
                  </div>
                )}
                <BarChart3 className="h-4 w-4 text-slate-600 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default VivaHistory;

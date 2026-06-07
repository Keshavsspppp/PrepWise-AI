import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { History, ArrowLeft, TrendingUp, TrendingDown, Minus, Calendar, Search } from 'lucide-react';

const SUBJECT_COLORS = {
  'DSA': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  'DBMS': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Operating Systems': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Computer Networks': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Aptitude': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
};

const getSubjectColor = (subject) => SUBJECT_COLORS[subject] || 'bg-slate-500/15 text-slate-400 border-slate-500/20';

const DeltaIcon = ({ before, after }) => {
  const delta = after - before;
  if (Math.abs(delta) < 1) return <Minus className="h-3.5 w-3.5 text-slate-400" />;
  if (delta > 0) return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  return <TrendingDown className="h-3.5 w-3.5 text-red-400" />;
};

const Sk = ({ h = 'h-16' }) => <div className={`animate-pulse bg-slate-800/50 rounded-xl ${h} w-full`} />;

const RevisionHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get('/revision/history');
        setHistory(res.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load revision history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = history.filter(h =>
    h.topic.toLowerCase().includes(search.toLowerCase()) ||
    h.subject.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const totalRevisions = history.length;
  const avgImprovement = history.length
    ? Math.round(history.reduce((s, h) => s + (h.retention_after - h.retention_before), 0) / history.length)
    : 0;
  const uniqueTopics = new Set(history.map(h => h.topic)).size;

  return (
    <DashboardLayout currentPage="Revision History">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/revision')}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-400" />
            <div>
              <h1 className="text-xl font-display font-bold text-text-primary">Revision History</h1>
              <p className="text-xs text-slate-500">Your complete revision log with retention changes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && history.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-white">{totalRevisions}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Total Revisions</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-emerald-400">+{avgImprovement}%</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Avg Retention Gain</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-white">{uniqueTopics}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Topics Revised</p>
          </div>
        </div>
      )}

      {/* Search */}
      {!loading && history.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by topic or subject..."
            className="w-full bg-slate-900/40 border border-slate-800/70 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/40 transition-colors"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Sk key={i} />)}
        </div>
      ) : error ? (
        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center text-center">
          <History className="h-12 w-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-400 mb-2">
            {history.length === 0 ? 'No Revision History' : 'No results found'}
          </h3>
          <p className="text-sm text-slate-600 max-w-xs">
            {history.length === 0
              ? 'Complete your first revision from the Smart Revision dashboard to start logging here.'
              : `No revisions match "${search}".`}
          </p>
          {history.length === 0 && (
            <button
              onClick={() => navigate('/revision')}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              Go to Revision Dashboard
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const delta = item.retention_after - item.retention_before;
            const deltaColor = delta > 0 ? 'text-emerald-400' : delta < -1 ? 'text-red-400' : 'text-slate-400';

            return (
              <div
                key={item.history_id}
                className="flex items-center gap-4 bg-slate-900/30 border border-slate-800/60 hover:border-slate-700/60 rounded-2xl px-5 py-4 transition-all duration-200"
              >
                {/* Icon */}
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <DeltaIcon before={item.retention_before} after={item.retention_after} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-white truncate">{item.topic}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getSubjectColor(item.subject)}`}>
                      {item.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Calendar className="h-3 w-3" />
                    <span>{item.revision_date}</span>
                  </div>
                </div>

                {/* Retention change */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-slate-500">{item.retention_before.toFixed(0)}%</span>
                    <span className="text-slate-700">→</span>
                    <span className="text-xs font-bold text-white">{item.retention_after.toFixed(0)}%</span>
                  </div>
                  <span className={`text-[11px] font-extrabold ${deltaColor}`}>
                    {delta > 0 ? '+' : ''}{delta.toFixed(0)}% change
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default RevisionHistory;

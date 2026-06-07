import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import MemoryHealthCard from '../components/MemoryHealthCard';
import RetentionChart from '../components/RetentionChart';
import TopicRiskCard from '../components/TopicRiskCard';
import RevisionTimeline from '../components/RevisionTimeline';
import RevisionRecommendationCard from '../components/RevisionRecommendationCard';
import RetentionCard from '../components/RetentionCard';
import {
  Brain, RefreshCcw, Loader2, AlertCircle,
  TrendingDown, Clock, Sparkles, History,
  ChevronRight, BarChart2, Activity
} from 'lucide-react';

// ── Skeleton loader ──────────────────────────────────────────────────────────
const Sk = ({ h = 'h-32', extra = '' }) => (
  <div className={`animate-pulse bg-slate-800/50 rounded-2xl ${h} ${extra}`} />
);

// ── Summary stat pill ────────────────────────────────────────────────────────
const StatPill = ({ label, value, color }) => (
  <div className={`flex flex-col items-center px-4 py-3 rounded-2xl border bg-slate-900/30 ${color}`}>
    <span className="text-xl font-extrabold text-white">{value}</span>
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</span>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const RevisionDashboard = () => {
  const navigate = useNavigate();

  const [retention, setRetention] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [aiTips, setAiTips] = useState({ recommendations: [], updatedAt: '' });
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All'); // All | High | Medium | Low

  // ── Show transient toast ─────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch all dashboard data ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [retRes, upRes, tipsRes] = await Promise.all([
        API.get('/revision/retention'),
        API.get('/revision/upcoming'),
        API.get('/revision/ai-tips'),
      ]);
      setRetention(retRes.data || []);
      setUpcoming(upRes.data || []);
      setAiTips({
        recommendations: tipsRes.data?.recommendations || [],
        updatedAt: tipsRes.data?.updated_at || '',
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load revision data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Recalculate ─────────────────────────────────────────────────────────
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      setError(null);
      const res = await API.post('/revision/recalculate');
      setAiTips({ recommendations: res.data.ai_recommendations || [], updatedAt: 'just now' });
      await fetchAll();
      showToast(`✅ Recalculated ${res.data.topics_processed} topics`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Recalculation failed.');
    } finally {
      setRecalculating(false);
    }
  };

  // ── Mark revision complete ──────────────────────────────────────────────
  const handleReviseComplete = async (topicId) => {
    try {
      setMarkingId(topicId);
      const res = await API.post('/revision/complete', { topic_id: topicId, completed: true });
      showToast(res.data.message || '✅ Revision marked complete!');
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to mark revision.', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const highRisk   = retention.filter(t => t.risk_level === 'High');
  const mediumRisk = retention.filter(t => t.risk_level === 'Medium');
  const lowRisk    = retention.filter(t => t.risk_level === 'Low');
  const avgRetention = retention.length
    ? Math.round(retention.reduce((s, t) => s + t.retention_score, 0) / retention.length)
    : 0;

  const filtered = activeFilter === 'All'
    ? retention
    : retention.filter(t => t.risk_level === activeFilter);

  const FILTERS = [
    { label: 'All',    count: retention.length,   color: 'border-slate-700 text-slate-300' },
    { label: 'High',   count: highRisk.length,    color: 'border-red-500/30 text-red-400' },
    { label: 'Medium', count: mediumRisk.length,  color: 'border-amber-500/30 text-amber-400' },
    { label: 'Low',    count: lowRisk.length,      color: 'border-emerald-500/30 text-emerald-400' },
  ];

  return (
    <DashboardLayout currentPage="Smart Revision">
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold border backdrop-blur-md transition-all duration-300
          ${toast.type === 'error'
            ? 'bg-red-950/90 border-red-500/30 text-red-300'
            : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/20">
            <Brain className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-text-primary leading-tight">Smart Revision Engine</h1>
            <p className="text-xs text-slate-500 mt-0.5">Ebbinghaus Forgetting Curve · AI-powered retention tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/revision/history')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
          <button
            id="recalculate-revision-btn"
            onClick={handleRecalculate}
            disabled={recalculating || loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {recalculating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            {recalculating ? 'Analyzing...' : 'Recalculate'}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <AlertCircle className="h-4.5 w-4.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={fetchAll} className="ml-auto text-xs text-red-300 hover:underline font-medium">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Sk h="h-20" /><Sk h="h-20" /><Sk h="h-20" /><Sk h="h-20" /></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Sk h="h-48" /><Sk h="h-48" extra="lg:col-span-2" /></div>
          <Sk h="h-64" />
        </div>
      ) : (
        <div className="space-y-7">

          {/* ── Row 1: Summary Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill label="Avg Retention" value={`${avgRetention}%`} color="border-cyan-500/20" />
            <StatPill label="High Risk" value={highRisk.length} color="border-red-500/20" />
            <StatPill label="Medium Risk" value={mediumRisk.length} color="border-amber-500/20" />
            <StatPill label="Topics Tracked" value={retention.length} color="border-slate-700/50" />
          </div>

          {/* ── Row 2: Memory Health + Retention Chart ── */}
          {retention.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Memory Health Overview</p>
                <MemoryHealthCard topics={retention} />
              </div>
              <div className="lg:col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Subject Retention Comparison</p>
                <RetentionChart topics={retention} />
              </div>
            </div>
          )}

          {/* ── Row 3: Upcoming Schedule + AI Tips ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Revision Schedule</p>
              <RevisionTimeline
                upcoming={upcoming}
                onRevise={handleReviseComplete}
                markingId={markingId}
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">AI Revision Tips</p>
              <RevisionRecommendationCard
                recommendations={aiTips.recommendations}
                updatedAt={aiTips.updatedAt}
                onRecalculate={handleRecalculate}
                loading={recalculating}
              />
            </div>
          </div>

          {/* ── Row 4: Topic Risk Grid ── */}
          {retention.length > 0 && (
            <div>
              {/* Filter tabs */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Topic Analysis</p>
                <div className="flex gap-1.5">
                  {FILTERS.map(f => (
                    <button
                      key={f.label}
                      onClick={() => setActiveFilter(f.label)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer
                        ${activeFilter === f.label
                          ? `${f.color} bg-slate-800/60`
                          : 'border-slate-800 text-slate-600 hover:text-slate-400'}`}
                    >
                      {f.label} {f.count > 0 && <span className="ml-0.5 opacity-70">{f.count}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="py-12 text-center bg-slate-900/20 border border-slate-800/40 rounded-3xl">
                  <p className="text-sm text-slate-500">No {activeFilter !== 'All' ? activeFilter + ' risk' : ''} topics found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.slice(0, 12).map((topic) => (
                    <TopicRiskCard
                      key={topic.topic_id}
                      {...topic}
                      onRevise={() => handleReviseComplete(topic.topic_id)}
                      loading={markingId === topic.topic_id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Empty state ── */}
          {retention.length === 0 && !error && (
            <div className="py-24 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 flex items-center justify-center mb-6">
                <TrendingDown className="h-10 w-10 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">No Retention Data Yet</h2>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
                Take some quizzes first. The Forgetting Curve Engine will then track how fast you're forgetting each topic.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#/quiz/generator" className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/60 border border-slate-700 hover:border-cyan-500/30 text-slate-300 text-sm font-semibold rounded-xl transition-all cursor-pointer">
                  Take a Quiz <ChevronRight className="h-4 w-4" />
                </a>
                <button
                  onClick={handleRecalculate}
                  disabled={recalculating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                >
                  {recalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {recalculating ? 'Analyzing...' : 'Run Analysis'}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </DashboardLayout>
  );
};

export default RevisionDashboard;

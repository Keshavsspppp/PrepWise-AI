import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import ReadinessScoreCard from '../components/ReadinessScoreCard';
import SubjectReadinessCard from '../components/SubjectReadinessCard';
import ReadinessChart from '../components/ReadinessChart';
import RecommendationPanel from '../components/RecommendationPanel';
import RiskIndicator from '../components/RiskIndicator';
import ProgressRing from '../components/ProgressRing';
import { GraduationCap, RefreshCcw, Loader2, AlertCircle, ChevronRight, Sparkles, BookOpen, TrendingUp } from 'lucide-react';

const Sk = ({ h = 'h-32', extra = '' }) => <div className={`animate-pulse bg-slate-800/50 rounded-2xl ${h} ${extra}`} />;

const StatPill = ({ label, value, sub, color = 'border-slate-700/50' }) => (
  <div className={`flex flex-col px-4 py-3 rounded-2xl border bg-slate-900/30 ${color}`}>
    <span className="text-xl font-extrabold text-white">{value}</span>
    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    {sub && <span className="text-[9px] text-slate-600 mt-0.5">{sub}</span>}
  </div>
);

const ExamReadiness = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [topicFilter, setTopicFilter] = useState('Weak'); // Weak | Strong | All

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await API.get('/readiness/overall');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load exam readiness data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      setError(null);
      const res = await API.post('/readiness/recalculate');
      setData(res.data);
      showToast('✅ Readiness scores recalculated successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Recalculation failed.');
    } finally {
      setRecalculating(false);
    }
  };

  const subjects = data?.subject_scores || [];
  const topics = data?.topic_scores || [];
  const recommendations = data?.recommendations || [];
  const overall = data?.overall_score || 0;

  const highRisk = subjects.filter(s => s.status === 'High Risk' || s.status === 'Needs Improvement');
  const ready    = subjects.filter(s => s.status === 'Ready');

  const filteredTopics = topicFilter === 'Weak'   ? topics.slice(0, 8) :
                         topicFilter === 'Strong'  ? topics.slice().reverse().slice(0, 8) : topics.slice(0, 12);

  // Sort subjects by readiness descending for ranking
  const rankedSubjects = subjects.slice().sort((a, b) => b.readiness_score - a.readiness_score);

  return (
    <DashboardLayout currentPage="Exam Readiness">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold border backdrop-blur-md
          ${toast.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-300' : 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20">
            <GraduationCap className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-text-primary leading-tight">Exam Readiness</h1>
            <p className="text-xs text-slate-500 mt-0.5">AI-powered exam preparation analysis · Multi-factor scoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="#/viva" className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer">
            <BookOpen className="h-3.5 w-3.5" /> Start Mock Viva
          </a>
          <button id="readiness-recalculate-btn" onClick={handleRecalculate} disabled={recalculating || loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {recalculating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            {recalculating ? 'Analyzing...' : 'Recalculate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <AlertCircle className="h-4.5 w-4.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={fetchData} className="ml-auto text-xs text-red-300 hover:underline font-medium">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <Sk key={i} h="h-20" />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Sk h="h-80" /><Sk h="h-80" extra="lg:col-span-2" /></div>
        </div>
      ) : (
        <div className="space-y-7">

          {/* Summary pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatPill label="Overall Readiness" value={`${Math.round(overall)}%`} color="border-violet-500/20" />
            <StatPill label="Exam Prediction" value={data?.prediction_status || '—'} color="border-indigo-500/20" />
            <StatPill label="High Risk Subjects" value={highRisk.length} sub={highRisk.map(s => s.subject).join(', ') || '—'} color="border-red-500/20" />
            <StatPill label="Exam Ready" value={ready.length} sub={`out of ${subjects.length} subjects`} color="border-emerald-500/20" />
          </div>

          {/* Main row: score card + chart */}
          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Overall Score</p>
                <ReadinessScoreCard {...data} />
              </div>
              <div className="lg:col-span-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Score Analysis</p>
                <ReadinessChart subjects={rankedSubjects} topics={topics} />
              </div>
            </div>
          )}

          {/* Subject readiness grid */}
          {subjects.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Subject Readiness Ranking</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {rankedSubjects.map((s, i) => (
                  <SubjectReadinessCard key={i} {...s} rank={i + 1} />
                ))}
              </div>
            </div>
          )}

          {/* Risk analysis */}
          {subjects.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Risk Analysis</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subjects.map((s, i) => (
                  <RiskIndicator key={i} score={s.readiness_score} label={s.subject} status={s.status === 'Ready' ? 'Exam Ready' : s.status === 'Good' ? 'Good Preparation' : s.status === 'Needs Improvement' ? 'Moderate Risk' : 'High Risk'} />
                ))}
              </div>
            </div>
          )}

          {/* Topics + Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic analysis */}
            {topics.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Topic Readiness</p>
                  <div className="flex gap-1">
                    {['Weak', 'Strong', 'All'].map(f => (
                      <button key={f} onClick={() => setTopicFilter(f)}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-xl border transition-all cursor-pointer
                          ${topicFilter === f ? 'bg-slate-800/60 text-white border-slate-700' : 'text-slate-600 border-slate-800 hover:text-slate-400'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-5 space-y-2">
                  {filteredTopics.map((t, i) => {
                    const color = t.readiness_score >= 75 ? '#22c55e' : t.readiness_score >= 50 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[9px] text-slate-400 w-28 truncate flex-shrink-0">{t.topic}</span>
                        <div className="flex-1 h-2 bg-slate-800/60 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(t.readiness_score, 2)}%`, backgroundColor: color, boxShadow: `0 0 4px ${color}55` }} />
                        </div>
                        <span className="text-[9px] font-bold text-white w-8 text-right" style={{ color }}>{t.readiness_score.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Recommendations */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">AI Recommendations</p>
              <RecommendationPanel
                recommendations={recommendations}
                onRecalculate={handleRecalculate}
                loading={recalculating}
                generated_at={data?.generated_at ? new Date(data.generated_at).toLocaleString() : ''}
              />
            </div>
          </div>

          {/* Empty state */}
          {!data && !error && (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
                <GraduationCap className="h-10 w-10 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">No Readiness Data Yet</h2>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">Take quizzes and upload notes to generate your exam readiness score.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#/quiz/generator" className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/60 border border-slate-700 text-slate-300 text-sm font-semibold rounded-xl cursor-pointer">
                  Take a Quiz <ChevronRight className="h-4 w-4" />
                </a>
                <button onClick={handleRecalculate} disabled={recalculating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-bold rounded-xl cursor-pointer disabled:opacity-50">
                  {recalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {recalculating ? 'Analyzing...' : 'Calculate Readiness'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ExamReadiness;

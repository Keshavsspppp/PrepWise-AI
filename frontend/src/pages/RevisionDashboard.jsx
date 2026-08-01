import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import MemoryHealthCard from '../components/MemoryHealthCard';
import RetentionChart from '../components/RetentionChart';
import TopicRiskCard from '../components/TopicRiskCard';
import RevisionTimeline from '../components/RevisionTimeline';
import RevisionRecommendationCard from '../components/RevisionRecommendationCard';
import { Brain, RefreshCcw, Loader2, AlertCircle, TrendingDown, Sparkles, History, ChevronRight } from 'lucide-react';
import { RevisionHistoryContent } from './RevisionHistory';
import Reveal from '../components/Reveal';

/* ── helpers ──────────────────────────────────────────────────────────── */
const Toast = ({ msg, type }) => (
  <div style={{
    position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 99,
    padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem', fontWeight: 600,
    background: type === 'error' ? 'var(--color-danger-dim)' : 'var(--color-success-dim)',
    border: `1px solid ${type === 'error' ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`,
    color: type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  }}>
    {msg}
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="label" style={{ marginBottom: '0.875rem' }}>{children}</p>
);

const StatCard = ({ label, value, col = 'var(--text-secondary)' }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', textAlign: 'center' }}>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.625rem', color: col }}>{value}</div>
    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
  </div>
);

const FILTER_COLORS = {
  All: 'var(--text-secondary)', High: 'var(--color-danger)', Medium: 'var(--color-primary)', Low: 'var(--color-accent)'
};

/* ── main ─────────────────────────────────────────────────────────────── */
export const RevisionDashboardContent = ({ initialShowHistory = false }) => {
  const [showHistory, setShowHistory] = useState(initialShowHistory);
  const [retention, setRetention] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [aiTips, setAiTips] = useState({ recommendations: [], updatedAt: '' });
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [retRes, upRes, tipsRes] = await Promise.all([
        API.get('/revision/retention'), API.get('/revision/upcoming'), API.get('/revision/ai-tips'),
      ]);
      setRetention(retRes.data || []);
      setUpcoming(upRes.data || []);
      setAiTips({ recommendations: tipsRes.data?.recommendations || [], updatedAt: tipsRes.data?.updated_at || '' });
    } catch (err) { setError(err.response?.data?.detail || 'Failed to load revision data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchAll, 0);
    return () => clearTimeout(t);
  }, [fetchAll]);

  useEffect(() => {
    const t = setTimeout(() => setShowHistory(initialShowHistory), 0);
    return () => clearTimeout(t);
  }, [initialShowHistory]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true); setError(null);
      const res = await API.post('/revision/recalculate');
      setAiTips({ recommendations: res.data.ai_recommendations || [], updatedAt: 'just now' });
      await fetchAll();
      showToast(`✅ Recalculated ${res.data.topics_processed} topics`);
    } catch (err) { setError(err.response?.data?.detail || 'Recalculation failed.'); }
    finally { setRecalculating(false); }
  };

  const handleReviseComplete = async (topicId) => {
    try {
      setMarkingId(topicId);
      const res = await API.post('/revision/complete', { topic_id: topicId, completed: true });
      showToast(res.data.message || '✅ Revision marked complete!');
      await fetchAll();
    } catch (err) { showToast(err.response?.data?.detail || 'Failed to mark revision.', 'error'); }
    finally { setMarkingId(null); }
  };

  const highRisk = retention.filter(t => t.risk_level === 'High');
  const mediumRisk = retention.filter(t => t.risk_level === 'Medium');
  const lowRisk = retention.filter(t => t.risk_level === 'Low');
  const avgRetention = retention.length ? Math.round(retention.reduce((s, t) => s + t.retention_score, 0) / retention.length) : 0;
  const filtered = activeFilter === 'All' ? retention : retention.filter(t => t.risk_level === activeFilter);

  const FILTERS = [
    { label: 'All', count: retention.length },
    { label: 'High', count: highRisk.length },
    { label: 'Medium', count: mediumRisk.length },
    { label: 'Low', count: lowRisk.length },
  ];

  if (showHistory) {
    return <RevisionHistoryContent onBack={() => setShowHistory(false)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {toast && <Toast {...toast} />}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={16} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>Smart Revision Engine</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.125rem' }}>Ebbinghaus Forgetting Curve · AI-powered retention tracking</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowHistory(true)} className="btn btn-ghost btn-sm"><History size={13} /> History</button>
          <button id="recalculate-revision-btn" onClick={handleRecalculate} disabled={recalculating || loading} className="btn btn-accent btn-sm">
            {recalculating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
            {recalculating ? 'Analyzing…' : 'Recalculate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
          <button onClick={fetchAll} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '0.8rem', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--color-accent-dim)', borderTop: '2px solid var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading revision data…</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
            <Reveal variant="pop" delay={50} style={{ width: '100%' }}>
              <StatCard label="Avg Retention" value={`${avgRetention}%`} col="var(--color-accent)" />
            </Reveal>
            <Reveal variant="pop" delay={100} style={{ width: '100%' }}>
              <StatCard label="High Risk" value={highRisk.length} col="var(--color-danger)" />
            </Reveal>
            <Reveal variant="pop" delay={150} style={{ width: '100%' }}>
              <StatCard label="Medium Risk" value={mediumRisk.length} col="var(--color-primary)" />
            </Reveal>
            <Reveal variant="pop" delay={200} style={{ width: '100%' }}>
              <StatCard label="Topics Tracked" value={retention.length} col="var(--text-secondary)" />
            </Reveal>
          </div>

          {/* Memory Health + Chart */}
          {retention.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
              <Reveal variant="left" delay={150} style={{ height: '100%' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                  <SectionLabel>Memory Health</SectionLabel>
                  <MemoryHealthCard topics={retention} />
                </div>
              </Reveal>
              <Reveal variant="right" delay={200} style={{ height: '100%' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                  <SectionLabel>Subject Retention Comparison</SectionLabel>
                  <RetentionChart topics={retention} />
                </div>
              </Reveal>
            </div>
          )}

          {/* Timeline + AI Tips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <Reveal variant="left" delay={250} style={{ height: '100%' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                <SectionLabel>Revision Schedule</SectionLabel>
                <RevisionTimeline upcoming={upcoming} onRevise={handleReviseComplete} markingId={markingId} />
              </div>
            </Reveal>
            <Reveal variant="right" delay={300} style={{ height: '100%' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                <SectionLabel>AI Revision Tips</SectionLabel>
                <RevisionRecommendationCard recommendations={aiTips.recommendations} updatedAt={aiTips.updatedAt} onRecalculate={handleRecalculate} loading={recalculating} />
              </div>
            </Reveal>
          </div>

          {/* Topic Risk Grid */}
          {retention.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <SectionLabel>Topic Analysis</SectionLabel>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {FILTERS.map(f => {
                    const col = FILTER_COLORS[f.label];
                    const active = activeFilter === f.label;
                    return (
                      <button key={f.label} onClick={() => setActiveFilter(f.label)} style={{
                        padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700,
                        border: `1px solid ${active ? col : 'var(--border-strong)'}`,
                        background: active ? col + '18' : 'transparent',
                        color: active ? col : 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all var(--transition)',
                      }}>
                        {f.label} {f.count > 0 && <span style={{ opacity: 0.7 }}>{f.count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              {filtered.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No {activeFilter !== 'All' ? activeFilter + ' risk' : ''} topics found.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))', gap: '0.875rem' }}>
                  {filtered.slice(0, 12).map((topic, i) => (
                    <Reveal key={topic.topic_id} variant="pop" delay={Math.min(i, 6) * 60}>
                      <TopicRiskCard {...topic} onRevise={() => handleReviseComplete(topic.topic_id)} loading={markingId === topic.topic_id} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {retention.length === 0 && !error && (
            <div style={{ padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={24} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Retention Data Yet</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '24rem', lineHeight: 1.6 }}>
                  Take some quizzes first. The Forgetting Curve Engine will track how fast you forget each topic.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="#/quiz/generator" className="btn btn-ghost">Take a Quiz <ChevronRight size={14} /></a>
                <button onClick={handleRecalculate} disabled={recalculating} className="btn btn-accent">
                  {recalculating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {recalculating ? 'Analyzing…' : 'Run Analysis'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const RevisionDashboard = () => {
  return (
    <DashboardLayout currentPage="Smart Revision">
      <RevisionDashboardContent />
    </DashboardLayout>
  );
};

export default RevisionDashboard;

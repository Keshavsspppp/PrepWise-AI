import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import ReadinessScoreCard from '../components/ReadinessScoreCard';
import SubjectReadinessCard from '../components/SubjectReadinessCard';
import ReadinessChart from '../components/ReadinessChart';
import RecommendationPanel from '../components/RecommendationPanel';
import RiskIndicator from '../components/RiskIndicator';
import { GraduationCap, RefreshCcw, Loader2, AlertCircle, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import Reveal from '../components/Reveal';

const Toast = ({ msg, type }) => (
  <div style={{
    position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 99,
    padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600,
    background: type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
    border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
    color: type === 'error' ? '#f87171' : '#34d399',
    backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  }}>{msg}</div>
);

const SectionLabel = ({ children }) => (
  <p className="label" style={{ marginBottom: '0.875rem' }}>{children}</p>
);

const StatCard = ({ label, value, sub, col = 'var(--text-primary)' }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: col, marginBottom: '0.125rem' }}>{value}</div>
    <div className="label">{label}</div>
    {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
  </div>
);

const retColor = (p) => p >= 75 ? 'var(--teal)' : p >= 50 ? 'var(--amber)' : '#ef4444';

export const ExamReadinessContent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [topicFilter, setTopicFilter] = useState('Weak');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await API.get('/readiness/overall');
      setData(res.data);
    } catch (err) { setError(err.response?.data?.detail || 'Failed to load exam readiness data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true); setError(null);
      const res = await API.post('/readiness/recalculate');
      setData(res.data);
      showToast('✅ Readiness scores recalculated!');
    } catch (err) { setError(err.response?.data?.detail || 'Recalculation failed.'); }
    finally { setRecalculating(false); }
  };

  const subjects = data?.subject_scores || [];
  const topics = data?.topic_scores || [];
  const recommendations = data?.recommendations || [];
  const overall = data?.overall_score || 0;
  const highRisk = subjects.filter(s => s.status === 'High Risk' || s.status === 'Needs Improvement');
  const ready = subjects.filter(s => s.status === 'Ready');
  const rankedSubjects = subjects.slice().sort((a, b) => b.readiness_score - a.readiness_score);
  const filteredTopics = topicFilter === 'Weak' ? topics.slice(0, 8) : topicFilter === 'Strong' ? topics.slice().reverse().slice(0, 8) : topics.slice(0, 12);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {toast && <Toast {...toast} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={16} style={{ color: 'var(--amber)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>Exam Readiness</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.125rem' }}>AI-powered exam preparation analysis · Multi-factor scoring</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="#/viva" className="btn btn-ghost btn-sm"><BookOpen size={13} /> Start Mock Viva</a>
          <button id="readiness-recalculate-btn" onClick={handleRecalculate} disabled={recalculating || loading} className="btn btn-primary btn-sm">
            {recalculating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
            {recalculating ? 'Analyzing…' : 'Recalculate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
          <button onClick={fetchData} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', textDecoration: 'underline', fontSize: '0.8rem' }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--amber-dim)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Calculating readiness…</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
            <Reveal variant="pop" delay={50} style={{ width: '100%' }}>
              <StatCard label="Overall Readiness" value={`${Math.round(overall)}%`} col="var(--amber)" />
            </Reveal>
            <Reveal variant="pop" delay={100} style={{ width: '100%' }}>
              <StatCard label="Exam Prediction" value={data?.prediction_status || '—'} col="var(--teal)" />
            </Reveal>
            <Reveal variant="pop" delay={150} style={{ width: '100%' }}>
              <StatCard label="High Risk Subjects" value={highRisk.length} sub={highRisk.map(s => s.subject).join(', ') || 'None'} col="#f87171" />
            </Reveal>
            <Reveal variant="pop" delay={200} style={{ width: '100%' }}>
              <StatCard label="Exam Ready" value={ready.length} sub={`out of ${subjects.length} subjects`} col="var(--teal)" />
            </Reveal>
          </div>

          {/* Score card + chart */}
          {data && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
              <Reveal variant="pop" delay={150} style={{ height: '100%' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                  <SectionLabel>Overall Score</SectionLabel>
                  <ReadinessScoreCard {...data} />
                </div>
              </Reveal>
              <Reveal variant="up" delay={200} style={{ height: '100%' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                  <SectionLabel>Score Analysis</SectionLabel>
                  <ReadinessChart subjects={rankedSubjects} topics={topics} />
                </div>
              </Reveal>
            </div>
          )}

          {/* Subject ranking */}
          {subjects.length > 0 && (
            <div>
              <SectionLabel>Subject Readiness Ranking</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', gap: '0.875rem' }}>
                {rankedSubjects.map((s, i) => (
                  <Reveal key={i} variant="up" delay={Math.min(i, 6) * 80}>
                    <SubjectReadinessCard {...s} rank={i + 1} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {/* Risk analysis */}
          {subjects.length > 0 && (
            <div>
              <SectionLabel>Risk Analysis</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: '0.75rem' }}>
                {subjects.map((s, i) => (
                  <Reveal key={i} variant="up" delay={Math.min(i, 6) * 60}>
                    <RiskIndicator score={s.readiness_score} label={s.subject}
                      status={s.status === 'Ready' ? 'Exam Ready' : s.status === 'Good' ? 'Good Preparation' : s.status === 'Needs Improvement' ? 'Moderate Risk' : 'High Risk'} />
                  </Reveal>
                ))}
              </div>
            </div>
          )}

          {/* Topics + Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {topics.length > 0 && (
              <Reveal variant="left" delay={250} style={{ height: '100%' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <SectionLabel>Topic Readiness</SectionLabel>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {['Weak', 'Strong', 'All'].map(f => (
                        <button key={f} onClick={() => setTopicFilter(f)} style={{
                          padding: '0.2rem 0.625rem', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700,
                          border: `1px solid ${topicFilter === f ? 'var(--amber-border)' : 'var(--border-strong)'}`,
                          background: topicFilter === f ? 'var(--amber-dim)' : 'transparent',
                          color: topicFilter === f ? 'var(--amber)' : 'var(--text-muted)',
                          cursor: 'pointer', transition: 'all var(--transition)',
                        }}>{f}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {filteredTopics.map((t, idx) => {
                      const col = retColor(t.readiness_score);
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '7rem', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.topic}</span>
                          <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '100px', background: col, width: `${Math.max(t.readiness_score, 2)}%`, transition: 'width 0.7s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: col, width: '2.5rem', textAlign: 'right', flexShrink: 0 }}>{t.readiness_score.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            )}
            <Reveal variant="right" delay={300} style={{ height: '100%' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                <SectionLabel>AI Recommendations</SectionLabel>
                <RecommendationPanel recommendations={recommendations} onRecalculate={handleRecalculate} loading={recalculating} generated_at={data?.generated_at ? new Date(data.generated_at).toLocaleString() : ''} />
              </div>
            </Reveal>
          </div>

          {/* Empty state */}
          {!data && !error && (
            <div style={{ padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: 'var(--radius-lg)', background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={24} style={{ color: 'var(--amber)' }} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Readiness Data Yet</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '24rem', lineHeight: 1.6 }}>Take quizzes and upload notes to generate your exam readiness score.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href="#/quiz/generator" className="btn btn-ghost">Take a Quiz <ChevronRight size={14} /></a>
                <button onClick={handleRecalculate} disabled={recalculating} className="btn btn-primary">
                  {recalculating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {recalculating ? 'Analyzing…' : 'Calculate Readiness'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ExamReadiness = () => {
  return (
    <DashboardLayout currentPage="Exam Readiness">
      <ExamReadinessContent />
    </DashboardLayout>
  );
};

export default ExamReadiness;

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import DNAOverviewCard from '../components/DNAOverviewCard';
import LearningScoreCard from '../components/LearningScoreCard';
import SubjectStrengthChart from '../components/SubjectStrengthChart';
import TopicAnalysisChart from '../components/TopicAnalysisChart';
import RecommendationCard from '../components/RecommendationCard';
import ProgressInsights from '../components/ProgressInsights';
import ConsistencyTracker from '../components/ConsistencyTracker';
import { Dna, RefreshCcw, AlertCircle, Loader2, CheckCircle2, Brain, Sparkles, ChevronRight, GraduationCap } from 'lucide-react';
import { RevisionDashboardContent } from './RevisionDashboard';
import { ExamReadinessContent } from './ExamReadiness';
import Reveal from '../components/Reveal';

/* ─── shared sub-components ─────────────────────────────────────────────── */
const StatusTag = ({ label, col = 'var(--teal)', dim, border }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '0.2rem 0.625rem', borderRadius: '100px',
    fontSize: '0.65rem', fontWeight: 700, fontFamily: 'var(--font-display)',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    background: dim || col + '18', border: `1px solid ${border || col + '40'}`, color: col,
  }}>
    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: col }} />
    {label}
  </span>
);

const SectionLabel = ({ children }) => (
  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.875rem' }}>
    {children}
  </p>
);

const SkRow = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
    {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '5rem', borderRadius: 'var(--radius-lg)' }} />)}
  </div>
);

const LearningDNA = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dna';

  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [profileRes, analyticsRes] = await Promise.all([
        API.get('/learning-dna'),
        API.get('/learning-dna/analytics'),
      ]);
      setProfile(profileRes.data);
      setAnalytics(analyticsRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      if (err.response?.status === 404) { setProfile(null); setAnalytics(null); }
      else setError(err.response?.data?.detail || 'Failed to load Learning DNA data.');
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'dna') {
      fetchData();
    }
  }, [fetchData, activeTab]);

  const handleRecalculate = async () => {
    try {
      setRecalculating(true); setError(null);
      await API.post('/learning-dna/recalculate');
      await fetchData();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to recalculate.'); }
    finally { setRecalculating(false); }
  };

  const dnaScore = profile
    ? Math.round((profile.consistency_score * 0.35 + profile.retention_score * 0.35 + profile.study_discipline_score * 0.30))
    : 0;
  const speedLabel = profile?.learning_speed
    ? profile.learning_speed.charAt(0).toUpperCase() + profile.learning_speed.slice(1).toLowerCase()
    : '—';

  const subjectPerformances = analytics?.subject_performances || [];
  const topicPerformances = analytics?.topic_performances || [];
  const recommendations = profile?.recommendations || [];
  const activityData = {
    total_sessions: analytics?.total_sessions || 0,
    total_study_hours: analytics?.total_study_hours || 0,
    notes_uploaded: analytics?.notes_uploaded || 0,
    questions_asked: analytics?.questions_asked || 0,
    active_days: analytics?.active_days || 0,
  };
  const activeDaysList = analytics?.active_days_list || [];
  const isEmpty = !loading && !profile && !error;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'revision':
        return <RevisionDashboardContent initialShowHistory={searchParams.get('sub') === 'history'} />;
      case 'readiness':
        return <ExamReadinessContent />;
      case 'dna':
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Dna size={16} style={{ color: 'var(--amber)' }} />
                </div>
                <div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.15 }}>Your Learning DNA</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.125rem' }}>AI-powered analysis of your study behavior & performance</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                {lastUpdated && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                <button id="recalculate-dna-btn" onClick={handleRecalculate} disabled={recalculating || loading} className="btn btn-primary btn-sm">
                  {recalculating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
                  {recalculating ? 'Analyzing…' : 'Recalculate DNA'}
                </button>
              </div>
            </div>

            {/* ── Error ── */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}><strong>Failed to load DNA</strong> — {error}</div>
                <button onClick={fetchData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: '0.8rem', textDecoration: 'underline' }}>Retry</button>
              </div>
            )}

            {/* ── Loading ── */}
            {loading && <><SkRow /><SkRow /></>}

            {/* ── Empty state ── */}
            {isEmpty && !error && (
              <div style={{ padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
                <div style={{ width: '4rem', height: '4rem', borderRadius: 'var(--radius-lg)', background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={24} style={{ color: 'var(--amber)' }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>No DNA Profile Yet</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '24rem', lineHeight: 1.6 }}>
                    Your Learning DNA is built from quiz performance and study sessions. Click <strong style={{ color: 'var(--amber)' }}>Recalculate DNA</strong> after completing some activities.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <a href="#/quiz/generator" className="btn btn-ghost">Take a Quiz <ChevronRight size={14} /></a>
                  <button onClick={handleRecalculate} disabled={recalculating} className="btn btn-primary">
                    {recalculating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {recalculating ? 'Analyzing…' : 'Generate DNA Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Main content ── */}
            {!loading && profile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* Status tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  {profile.strong_subjects?.length > 0 && (
                    <StatusTag label={`Strong in ${profile.strong_subjects.slice(0,2).join(', ')}`} col="var(--teal)" />
                  )}
                  {profile.weak_subjects?.length > 0 && (
                    <StatusTag label={`Needs work: ${profile.weak_subjects.slice(0,2).join(', ')}`} col="#f87171" />
                  )}
                  {profile.learning_speed && (
                    <StatusTag label={`${speedLabel} Learner`} col="var(--amber)" />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: 'auto' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--teal)' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DNA up to date</span>
                  </div>
                </div>

                {/* Overview metric cards */}
                <Reveal variant="pop" delay={80}>
                  <div>
                    <SectionLabel>Overview Metrics</SectionLabel>
                    <DNAOverviewCard speed={speedLabel} consistency={profile.consistency_score ?? 0} streak={analytics?.streak ?? 0} discipline={profile.study_discipline_score ?? 0} />
                  </div>
                </Reveal>

                {/* DNA Score + Subject Mastery */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
                  <Reveal variant="pop" delay={160} style={{ height: '100%' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                      <SectionLabel>Overall DNA Score</SectionLabel>
                      <LearningScoreCard score={dnaScore} />
                    </div>
                  </Reveal>
                  <Reveal variant="pop" delay={240} style={{ height: '100%' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                      <SectionLabel>Subject Mastery</SectionLabel>
                      <SubjectStrengthChart performances={subjectPerformances} />
                    </div>
                  </Reveal>
                </div>

                {/* Topic + Activity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <Reveal variant="pop" delay={320} style={{ height: '100%' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                      <SectionLabel>Topic Analysis</SectionLabel>
                      <TopicAnalysisChart topics={topicPerformances} />
                    </div>
                  </Reveal>
                  <Reveal variant="pop" delay={400} style={{ height: '100%' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                      <SectionLabel>Activity Insights</SectionLabel>
                      <ProgressInsights activity={activityData} />
                    </div>
                  </Reveal>
                </div>

                {/* Consistency + Recommendations */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <Reveal variant="pop" delay={480} style={{ height: '100%' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                      <SectionLabel>Consistency Tracker · 28-day heatmap</SectionLabel>
                      <ConsistencyTracker streak={analytics?.streak ?? 0} consistency_score={profile.consistency_score ?? 0} active_days_list={activeDaysList} />
                    </div>
                  </Reveal>
                  <Reveal variant="pop" delay={560} style={{ height: '100%' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', height: '100%' }}>
                      <SectionLabel>AI Recommendations · Gemini personalized tips</SectionLabel>
                      <RecommendationCard recommendations={recommendations} />
                    </div>
                  </Reveal>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <DashboardLayout currentPage="Mastery & Insights">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Tab Selector */}
        <div style={{
          display: 'flex', gap: '0.375rem', background: 'rgba(255,255,255,0.03)',
          padding: '0.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
          alignSelf: 'flex-start', marginBottom: '0.25rem'
        }}>
          {[
            { id: 'dna', label: 'Learning DNA', icon: Dna },
            { id: 'revision', label: 'Smart Revision', icon: Brain },
            { id: 'readiness', label: 'Exam Readiness', icon: GraduationCap },
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSearchParams({ tab: t.id })}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem', fontWeight: 600, border: 'none',
                  background: active ? 'var(--amber-dim)' : 'transparent',
                  color: active ? 'var(--amber)' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all var(--transition)',
                }}
                onMouseEnter={e => { if(!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { if(!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content wrapped in a premium entry fade-up animation */}
        <div className="animate-fade-up" key={activeTab}>
          {renderTabContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LearningDNA;

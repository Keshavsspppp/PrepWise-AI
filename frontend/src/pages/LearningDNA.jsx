import React, { useState, useEffect, useCallback } from 'react';
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
import { 
  Dna, 
  RefreshCcw, 
  AlertCircle, 
  ChevronRight, 
  Loader2, 
  CheckCircle2,
  Brain,
  Sparkles
} from 'lucide-react';


// ─── Status Tag ─────────────────────────────────────────────────────────────
const StatusTag = ({ label, color }) => (
  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${color}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {label}
  </span>
);

// ─── Section Header ──────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle, iconColor }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className={`flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-slate-900/60 border border-slate-800/60 ${iconColor}`}>
      <Icon className="h-4.5 w-4.5" />
    </div>
    <div>
      <h2 className="text-sm font-bold text-text-primary">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── Loading Skeleton ────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-800/50 rounded-2xl ${className}`} />
);

// ─── Main Page ───────────────────────────────────────────────────────────────
const LearningDNA = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Fetch DNA profile + analytics ─────────────────────────────────────────
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
      if (err.response?.status === 404) {
        setProfile(null);
        setAnalytics(null);
      } else {
        setError(err.response?.data?.detail || 'Failed to load Learning DNA data.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Recalculate profile ────────────────────────────────────────────────────
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      setError(null);
      await API.post('/learning-dna/recalculate');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to recalculate DNA profile.');
    } finally {
      setRecalculating(false);
    }
  };

  // ─── Derive display values ─────────────────────────────────────────────────
  const dnaScore = profile
    ? Math.round(
        (profile.consistency_score * 0.35 +
          profile.retention_score * 0.35 +
          profile.study_discipline_score * 0.30)
      )
    : 0;

  const speedLabel =
    profile?.learning_speed
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

  // ─── Empty State ──────────────────────────────────────────────────────────
  const isEmpty = !loading && !profile && !error;

  return (
    <DashboardLayout currentPage="Learning DNA">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
            <Dna className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-text-primary leading-tight">
              Your Learning DNA
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              AI-powered analysis of your study behavior &amp; performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-slate-600 font-medium hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            id="recalculate-dna-btn"
            onClick={handleRecalculate}
            disabled={recalculating || loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {recalculating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="h-3.5 w-3.5" />
            )}
            {recalculating ? 'Analyzing...' : 'Recalculate DNA'}
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <AlertCircle className="h-4.5 w-4.5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Failed to load DNA</p>
            <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
          </div>
          <button onClick={fetchData} className="ml-auto text-xs text-red-300 hover:text-red-200 underline font-medium whitespace-nowrap">
            Retry
          </button>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 lg:col-span-1" />
            <Skeleton className="h-48 lg:col-span-2" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      )}

      {/* ── Empty / First-time State ── */}
      {isEmpty && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 mb-6 shadow-lg shadow-indigo-500/10">
            <Brain className="h-10 w-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">No DNA Profile Yet</h2>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed mb-6">
            Your Learning DNA is built from quiz performance, study sessions, and AI interactions. 
            Click <strong className="text-indigo-400">Recalculate DNA</strong> after completing some activities.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="#/quiz/generator"
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/60 border border-slate-700 hover:border-indigo-500/40 text-slate-300 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer"
            >
              Take a Quiz <ChevronRight className="h-4 w-4" />
            </a>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
            >
              {recalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {recalculating ? 'Analyzing...' : 'Generate DNA Profile'}
            </button>
          </div>
        </div>
      )}

      {/* ── Main Dashboard Content ── */}
      {!loading && profile && (
        <div className="space-y-7">

          {/* ── Row 1: Status Tags ── */}
          <div className="flex flex-wrap gap-2 items-center">
            {profile.strong_subjects?.length > 0 && (
              <StatusTag
                label={`Strong in ${profile.strong_subjects.slice(0, 2).join(', ')}`}
                color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              />
            )}
            {profile.weak_subjects?.length > 0 && (
              <StatusTag
                label={`Needs work: ${profile.weak_subjects.slice(0, 2).join(', ')}`}
                color="bg-rose-500/10 border-rose-500/20 text-rose-400"
              />
            )}
            {profile.learning_speed && (
              <StatusTag
                label={`${speedLabel} Learner`}
                color="bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
              />
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[10px] text-slate-500 font-medium">DNA up to date</span>
            </div>
          </div>

          {/* ── Row 2: Overview Metric Cards ── */}
          <DNAOverviewCard
            speed={speedLabel}
            consistency={profile.consistency_score ?? 0}
            streak={analytics?.streak ?? 0}
            discipline={profile.study_discipline_score ?? 0}
          />

          {/* ── Row 3: DNA Score Radial + Subject Mastery ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <SectionHeader
                icon={Dna}
                title="Overall DNA Score"
                subtitle="Composite learning index"
                iconColor="text-cyan-400"
              />
              <LearningScoreCard score={dnaScore} />
            </div>
            <div className="lg:col-span-2">
              <SectionHeader
                icon={Brain}
                title="Subject Mastery"
                subtitle="Performance per subject"
                iconColor="text-violet-400"
              />
              <SubjectStrengthChart performances={subjectPerformances} />
            </div>
          </div>

          {/* ── Row 4: Topic Analysis + Progress Insights ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <SectionHeader
                icon={Brain}
                title="Topic Analysis"
                subtitle="Deep-dive into individual topics"
                iconColor="text-indigo-400"
              />
              <TopicAnalysisChart topics={topicPerformances} />
            </div>
            <div>
              <SectionHeader
                icon={Brain}
                title="Activity Insights"
                subtitle="Your overall study metrics"
                iconColor="text-emerald-400"
              />
              <ProgressInsights activity={activityData} />
            </div>
          </div>

          {/* ── Row 5: Consistency Tracker + Recommendations ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <SectionHeader
                icon={Brain}
                title="Consistency Tracker"
                subtitle="28-day study heatmap"
                iconColor="text-amber-400"
              />
              <ConsistencyTracker
                streak={analytics?.streak ?? 0}
                consistency_score={profile.consistency_score ?? 0}
                active_days_list={activeDaysList}
              />
            </div>
            <div>
              <SectionHeader
                icon={Sparkles}
                title="AI Recommendations"
                subtitle="Personalized growth tips from Gemini"
                iconColor="text-primary"
              />
              <RecommendationCard recommendations={recommendations} />
            </div>
          </div>

        </div>
      )}
    </DashboardLayout>
  );
};

export default LearningDNA;

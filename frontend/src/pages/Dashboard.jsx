import { useState, useEffect } from 'react';
import { FileText, Award, Brain, TrendingUp, ArrowUpRight, Zap, Play, Target, ShieldAlert, Activity, ChevronRight } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Reveal from '../components/Reveal';
import useCountUp from '../hooks/useCountUp';
/* ── helpers ──────────────────────────────────────────────────────────── */
const pct = (n) => `${n}%`;
const retColor = (p) => p < 50 ? 'var(--color-danger)' : p < 75 ? 'var(--color-warning)' : 'var(--color-success)';
/* ── sub-components ───────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color, href, numeric, suffix = '' }) => {
  const animatedValue = useCountUp(numeric, { duration: 1000, trigger: numeric != null });
  const displayValue = numeric != null ? `${animatedValue}${suffix}` : value;
  return (
    <a href={href || '#'} style={{
      display: 'block', background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '1.25rem', cursor: 'pointer',
      transition: 'all var(--transition)', textDecoration: 'none',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: color + '20', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} style={{ color }} />
        </div>
        <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="stat-value">
        {numeric != null ? <span className="stat-value-animated">{displayValue}</span> : value}
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{sub}</div>}
    </a>
  );
};
const TopicBar = ({ name, pct: p, note }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{name}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: retColor(p) }}>{p}%</span>
    </div>
    <div className="progress-track">
      <div className="progress-fill" style={{ width: pct(p), background: retColor(p) }} />
    </div>
    {note && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{note}</div>}
  </div>
);
/* ── main ─────────────────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const firstName = user?.name?.split(' ')[0] || 'Student';
  useEffect(() => {
    (async () => {
      try {
        const [n, q] = await Promise.allSettled([API.get('/notes'), API.get('/quiz/history')]);
        const notes = n.status === 'fulfilled' ? n.value.data : [];
        const quizzes = q.status === 'fulfilled' ? q.value.data : [];
        const avg = quizzes.length ? Math.round(quizzes.reduce((s, x) => s + (x.percentage || 0), 0) / quizzes.length) : 0;
        setStats({ noteCount: notes.length, quizCount: quizzes.length, avgScore: avg });
      } catch { setStats({ noteCount: 0, quizCount: 0, avgScore: 0 }); }
    })();
  }, []);
  const cards = [
    { icon: FileText, label: 'Notes Uploaded',   value: stats ? `${stats.noteCount}` : '—',    sub: 'PDF documents',       color: 'var(--amber)',  href: '#/notes/list', numeric: stats?.noteCount },
    { icon: Award,    label: 'Quiz Accuracy',     value: stats ? `${stats.avgScore}%` : '—',    sub: 'Average all quizzes', color: 'var(--teal)',   href: '#/quiz/history', numeric: stats?.avgScore, suffix: '%' },
    { icon: Brain,    label: 'Quizzes Attempted', value: stats ? `${stats.quizCount}` : '—',    sub: 'All time',            color: 'var(--color-purple)', href: '#/quiz/history', numeric: stats?.quizCount },
    { icon: TrendingUp, label: 'Exam Readiness', value: '—',                                    sub: 'Calculate now',       color: 'var(--color-pink)', href: '#/readiness' },
  ];
  const actions = [
    { icon: Play,     label: 'Generate Quiz',   desc: 'AI quiz from your notes',    href: '/quiz/generator', color: 'var(--amber)' },
    { icon: Brain,    label: 'Ask AI',           desc: 'Grounded Q&A',              href: '/ai/ask',         color: 'var(--teal)' },
    { icon: FileText, label: 'Upload Notes',     desc: 'Add a PDF',                 href: '/notes/upload',   color: 'var(--color-purple)' },
    { icon: Target,   label: 'Readiness',        desc: 'Exam score check',          href: '/readiness',      color: 'var(--color-pink)' },
  ];
  return (
    <DashboardLayout currentPage="Dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* ── Hero ── */}
        <div style={{
          borderRadius: 'var(--radius-xl)', padding: '2rem 2.25rem', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--amber-dim) 0%, var(--teal-dim) 100%)',
          border: '1px solid var(--amber-border)',
        }}>
          <div style={{ position: 'absolute', right: '-2rem', top: '-2rem', width: '10rem', height: '10rem', borderRadius: '50%', background: 'rgba(245,158,11,0.06)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="badge badge-amber" style={{ marginBottom: '0.875rem' }}>✦ PrepWise Intelligence</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.625rem', marginBottom: '0.5rem' }}>
              Good day, {firstName}! 👋
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '1.25rem', maxWidth: '32rem', lineHeight: 1.6 }}>
              Your AI study system is ready. Upload notes, generate quizzes grounded in your material, and track mastery.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/quiz/generator')} className="btn btn-primary">
                <Play size={14} /> Start Quiz
              </button>
              <button onClick={() => navigate('/notes/upload')} className="btn btn-ghost">
                <FileText size={14} /> Upload Notes
              </button>
            </div>
          </div>
        </div>
        {/* ── Stats grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {cards.map((c, i) => (
            <Reveal key={c.label} variant="pop" delay={i * 80}>
              <StatCard {...c} />
            </Reveal>
          ))}
        </div>
        {/* ── Quick actions ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Zap size={15} style={{ color: 'var(--amber)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Quick Actions</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {actions.map((a, i) => (
              <Reveal key={a.label} variant="up" delay={i * 70}>
                <button onClick={() => navigate(a.href)} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                  padding: '1.125rem', textAlign: 'left', cursor: 'pointer', transition: 'all var(--transition)',
                  width: '100%'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)', background: a.color + '18', border: `1px solid ${a.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <a.icon size={14} style={{ color: a.color }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{a.desc}</div>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
        {/* ── DNA + Forgetting ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {/* Learning DNA */}
          <Reveal variant="left">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)', background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={14} style={{ color: 'var(--amber)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem' }}>Learning DNA</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mastery by retention</p>
                  </div>
                </div>
                <a href="#/dna" className="btn btn-ghost btn-sm" style={{ gap: '0.25rem' }}>
                  Full report <ChevronRight size={12} />
                </a>
              </div>
              <div className="divider" style={{ marginBottom: '1.25rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <p className="label" style={{ color: 'rgba(239,68,68,0.7)', marginBottom: '0.75rem' }}>⚠ Needs Attention</p>
                  <TopicBar name="Dynamic Programming" pct={42} note="Critical — revise today" />
                  <TopicBar name="Operating Systems" pct={67} note="Review in 2 days" />
                </div>
                <div>
                  <p className="label" style={{ color: 'rgba(16,185,129,0.7)', marginBottom: '0.75rem' }}>✓ Mastered</p>
                  <TopicBar name="DBMS Indexing" pct={92} note="Keep reviewing weekly" />
                  <TopicBar name="Computer Networks" pct={88} note="Strong — maintain" />
                </div>
              </div>
            </div>
          </Reveal>
          {/* Forgetting Curve */}
          <Reveal variant="right" delay={100}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                <ShieldAlert size={15} style={{ color: 'var(--amber)' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem' }}>Forgetting Curve</h3>
              </div>
              <div className="alert alert-amber" style={{ marginBottom: '1rem', fontSize: '0.8125rem' }}>
                <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                Retrieval practice for <strong>Dynamic Programming</strong> is due today.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  { name: 'Dynamic Programming', ret: 42, status: 'Critical', href: '#/revision', btnLabel: 'Revise Now', urgent: true },
                  { name: 'Operating Systems', ret: 75, status: 'Medium', href: '#/revision', btnLabel: 'Schedule', urgent: false },
                  { name: 'DBMS Indexing', ret: 92, status: 'Excellent', href: null, btnLabel: 'Solid ✓', urgent: false },
                ].map(t => (
                  <div key={t.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', transition: 'all var(--transition)' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: retColor(t.ret), marginTop: '0.125rem' }}>{t.ret}% · {t.status}</div>
                    </div>
                    {t.href
                      ? <a href={t.href} className={`btn btn-sm ${t.urgent ? 'btn-outline' : 'btn-ghost'}`}>{t.btnLabel}</a>
                      : <span className="btn btn-ghost btn-sm" style={{ opacity: 0.4, cursor: 'default' }}>{t.btnLabel}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
        {/* ── Activity ── */}
        <Reveal variant="up">
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
              <Activity size={15} style={{ color: 'var(--text-secondary)' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem' }}>Recent Activity</h3>
            </div>
            <div className="divider" style={{ marginBottom: '0.75rem' }} />
            {[
              { letter: 'Q', color: 'var(--teal)',   title: 'Completed Quiz: DBMS Transactions', sub: '10 Questions · Easy', score: '90%', time: '2h ago' },
              { letter: 'N', color: 'var(--amber)',  title: 'Uploaded Notes: CN_Routing.pdf', sub: 'Computer Networks · 45 pages', score: 'Indexed', time: 'Yesterday' },
              { letter: 'V', color: 'var(--color-purple)',       title: 'AI Mock Viva: Operating Systems', sub: 'Process synchronization', score: '75%', time: '3 days ago' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: a.color + '18', border: `1px solid ${a.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', color: a.color, flexShrink: 0 }}>{a.letter}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{a.sub}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>{a.score}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </DashboardLayout>
  );
};
export default Dashboard;
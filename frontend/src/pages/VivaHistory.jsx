import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { History, ArrowLeft, Mic, BarChart3, Search, Calendar, Inbox } from 'lucide-react';
import Reveal from '../components/Reveal';

const GRADE = (avg) => {
  if (avg === null || avg === undefined) return { label: 'Pending',          col: 'var(--text-muted)', dim: 'var(--border)', border: 'var(--border-strong)' };
  if (avg >= 8.5) return { label: 'Distinction',    col: 'var(--teal)',  dim: 'var(--teal-dim)',  border: 'var(--teal-border)' };
  if (avg >= 7.0) return { label: 'Merit',           col: 'var(--amber)', dim: 'var(--amber-dim)', border: 'var(--amber-border)' };
  if (avg >= 5.0) return { label: 'Pass',            col: '#818cf8', dim: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' };
  return            { label: 'Needs Improvement', col: '#f87171', dim: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' };
};

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button onClick={() => navigate('/viva')} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem' }}>
              <ArrowLeft size={15} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <History size={16} style={{ color: 'var(--teal)' }} />
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>Viva History</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>All completed mock viva sessions</p>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/viva')} className="btn btn-teal btn-sm">
            <Mic size={13} /> New Viva
          </button>
        </div>

        {/* Summary */}
        {!loading && history.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {[
              { label: 'Sessions',  value: history.length,                         col: 'var(--text-primary)' },
              { label: 'Avg Score', value: avgScore,                               col: 'var(--teal)' },
              { label: 'Subjects',  value: new Set(history.map(h => h.subject)).size, col: 'var(--amber)' },
            ].map((s, idx) => (
              <Reveal key={s.label} variant="pop" delay={idx * 60} style={{ width: '100%' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.125rem', textAlign: 'center', height: '100%' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.625rem', color: s.col }}>{s.value}</div>
                  <div className="label" style={{ marginTop: '0.25rem' }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* Search */}
        {!loading && history.length > 0 && (
          <Reveal variant="up" delay={180}>
            <div className="input-icon">
              <Search size={15} className="icon" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject or difficulty…" className="input-field" />
            </div>
          </Reveal>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--teal-dim)', borderTop: '2px solid var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading sessions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.375rem' }}>{history.length === 0 ? 'No Viva Sessions Yet' : 'No results found'}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '22rem' }}>
                {history.length === 0 ? 'Start your first AI Mock Viva to see it here.' : `No sessions match "${search}".`}
              </p>
            </div>
            {history.length === 0 && (
              <button onClick={() => navigate('/viva')} className="btn btn-teal">
                <Mic size={14} /> Start First Viva
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {filtered.map((session, i) => {
              const pct = session.avg_score !== null ? Math.round(session.avg_score * 10) : null;
              const g = GRADE(session.avg_score);
              return (
                <Reveal key={session.viva_id} variant="up" delay={Math.min(i, 6) * 60}>
                  <div 
                    onClick={() => navigate('/viva/results', { state: { vivaId: session.viva_id } })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                      padding: '1rem 1.25rem', cursor: 'pointer', transition: 'all var(--transition)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal-border)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    {/* Icon */}
                    <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: 'var(--teal-dim)', border: '1px solid var(--teal-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mic size={14} style={{ color: 'var(--teal)' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{session.subject}</span>
                        <span style={{ display: 'inline-flex', padding: '0.125rem 0.5rem', borderRadius: '100px', fontSize: '0.6rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textTransform: 'uppercase', background: g.dim, border: `1px solid ${g.border}`, color: g.col }}>{g.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={11} />{new Date(session.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>{session.difficulty}</span>
                        <span>{session.question_count} Questions</span>
                      </div>
                    </div>

                    {/* Score */}
                    {pct !== null && (
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: pct >= 70 ? 'var(--teal)' : pct >= 50 ? 'var(--amber)' : '#f87171' }}>{pct}%</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{session.avg_score}/10 avg</div>
                      </div>
                    )}

                    <BarChart3 size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VivaHistory;

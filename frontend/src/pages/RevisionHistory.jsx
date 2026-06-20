import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { History, ArrowLeft, Search, Calendar, TrendingUp, TrendingDown, Minus, Inbox } from 'lucide-react';
import Reveal from '../components/Reveal';
const SUBJECT_COLORS = {
  'DSA':                { color: 'var(--amber)',  dim: 'var(--amber-dim)',  border: 'var(--amber-border)' },
  'DBMS':               { color: 'var(--teal)',   dim: 'var(--teal-dim)',   border: 'var(--teal-border)' },
  'Operating Systems':  { color: '#fb923c', dim: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)' },
  'Computer Networks':  { color: '#818cf8', dim: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' },
  'Aptitude':           { color: '#f472b6', dim: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)' },
};
const getSubjectCfg = (s) => SUBJECT_COLORS[s] || { color: 'var(--text-secondary)', dim: 'var(--border)', border: 'var(--border-strong)' };
const retColor = (p) => p < 50 ? '#ef4444' : p < 75 ? 'var(--amber)' : 'var(--teal)';
const DeltaIcon = ({ before, after }) => {
  const d = after - before;
  if (Math.abs(d) < 1) return <Minus size={14} style={{ color: 'var(--text-muted)' }} />;
  if (d > 0) return <TrendingUp size={14} style={{ color: 'var(--teal)' }} />;
  return <TrendingDown size={14} style={{ color: '#f87171' }} />;
};
export const RevisionHistoryContent = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  useEffect(() => {
    API.get('/revision/history')
      .then(res => setHistory(res.data || []))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load revision history.'))
      .finally(() => setLoading(false));
  }, []);
  const filtered = history.filter(h =>
    h.topic.toLowerCase().includes(search.toLowerCase()) ||
    h.subject.toLowerCase().includes(search.toLowerCase())
  );
  const totalRevisions = history.length;
  const avgImprovement = history.length
    ? Math.round(history.reduce((s, h) => s + (h.retention_after - h.retention_before), 0) / history.length) : 0;
  const uniqueTopics = new Set(history.map(h => h.topic)).size;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          {onBack && (
            <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem' }}>
              <ArrowLeft size={15} />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <History size={16} style={{ color: 'var(--amber)' }} />
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>Revision History</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Your complete revision log with retention changes</p>
            </div>
          </div>
        </div>
      </div>
      {/* Summary stats */}
      {!loading && history.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          {[
            { label: 'Total Revisions', value: totalRevisions, col: 'var(--text-primary)' },
            { label: 'Avg Retention Gain', value: `+${avgImprovement}%`, col: 'var(--teal)' },
            { label: 'Topics Revised', value: uniqueTopics, col: 'var(--amber)' },
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
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by topic or subject…" className="input-field" />
          </div>
        </Reveal>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--amber-dim)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading revision log…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Inbox size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.375rem' }}>{history.length === 0 ? 'No Revision History' : 'No results found'}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '20rem' }}>
              {history.length === 0 ? 'Complete your first revision from the Smart Revision dashboard.' : `No revisions match "${search}".`}
            </p>
          </div>
          {history.length === 0 && onBack && (
            <button onClick={onBack} className="btn btn-primary">Go to Revision Engine</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filtered.map((item, i) => {
            const delta = item.retention_after - item.retention_before;
            const deltaCol = delta > 0 ? 'var(--teal)' : delta < -1 ? '#f87171' : 'var(--text-muted)';
            const cfg = getSubjectCfg(item.subject);
            return (
              <Reveal key={item.history_id} variant="up" delay={Math.min(i, 6) * 60}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                  padding: '1rem 1.25rem', transition: 'all var(--transition)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                >
                  {/* Icon */}
                  <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DeltaIcon before={item.retention_before} after={item.retention_after} />
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.topic}</span>
                      <span style={{ display: 'inline-flex', padding: '0.125rem 0.5rem', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700, background: cfg.dim, border: `1px solid ${cfg.border}`, color: cfg.color, flexShrink: 0 }}>{item.subject}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Calendar size={11} /> {item.revision_date}
                    </div>
                  </div>
                  {/* Retention */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.125rem' }}>
                      <span style={{ fontSize: '0.75rem', color: retColor(item.retention_before) }}>{item.retention_before.toFixed(0)}%</span>
                      <span style={{ color: 'var(--border-strong)' }}>→</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: retColor(item.retention_after) }}>{item.retention_after.toFixed(0)}%</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: deltaCol }}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(0)}% change
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
};
const RevisionHistory = () => {
  const navigate = useNavigate();
  return (
    <DashboardLayout currentPage="Revision History">
      <RevisionHistoryContent onBack={() => navigate('/revision')} />
    </DashboardLayout>
  );
};
export default RevisionHistory;
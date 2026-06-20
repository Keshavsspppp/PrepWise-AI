import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, Sparkles, AlertCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import QuizCard from '../components/QuizCard';
import API from '../api/axios';
import Reveal from '../components/Reveal';

const SUBJECTS = ['All', 'DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude', 'Other'];

const QuizHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sub, setSub] = useState('All');

  const load = async () => {
    try { setLoading(true); setError(''); const r = await API.get('/quiz/history'); setHistory(r.data); }
    catch { setError('Failed to load quiz history. Please reload.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = history.filter(h =>
    h.topic.toLowerCase().includes(search.toLowerCase()) && (sub === 'All' || h.subject === sub)
  );

  return (
    <DashboardLayout currentPage="AI Quiz Planner">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.25rem' }}>Quiz History</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Review past performance and re-attempt previous quizzes.</p>
          </div>
          <button onClick={() => navigate('/quiz/generator')} className="btn btn-primary">
            <Plus size={14} /> Generate New Quiz
          </button>
        </div>

        {/* Search + filter */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="input-icon" style={{ flex: 1, minWidth: '12rem' }}>
            <Search size={15} className="icon" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by topic…" className="input-field" />
          </div>
          <select value={sub} onChange={e => setSub(e.target.value)} className="input-field" style={{ width: '11rem', cursor: 'pointer' }}>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--amber-dim)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading attempts…</p>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
            <button onClick={load} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.375rem' }}>No Quizzes Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {search || sub !== 'All' ? 'No attempts match your filters.' : "You haven't taken any quizzes yet."}
              </p>
            </div>
            {!search && sub === 'All' && (
              <button onClick={() => navigate('/quiz/generator')} className="btn btn-primary">
                <Sparkles size={14} /> Generate First Quiz
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((a, i) => (
              <Reveal key={a.result_id} variant="up" delay={Math.min(i, 6) * 60}>
                <QuizCard 
                  attempt={a} 
                  onRetake={() => navigate(`/quiz/attempt/${a.quiz_id}`)} 
                  onViewResults={() => navigate(`/quiz/result/${a.result_id}`)}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuizHistory;

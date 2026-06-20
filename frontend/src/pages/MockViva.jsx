import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { Mic, BookOpen, BarChart3, AlertCircle, ChevronRight, Clock, History, Zap } from 'lucide-react';
import Reveal from '../components/Reveal';
const SUBJECTS = ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude', 'Other'];
const DIFFICULTIES = [
  { label: 'Easy',   desc: 'Foundational recall',      color: 'var(--color-accent)', dim: 'var(--color-accent-dim)' },
  { label: 'Medium', desc: 'Conceptual understanding', color: 'var(--color-primary)', dim: 'var(--color-primary-dim)' },
  { label: 'Hard',   desc: 'Analysis & edge cases',    color: 'var(--color-danger)', dim: 'var(--color-danger-dim)' },
];
const COUNTS = [5, 10, 15];
const HOW = [
  { icon: BookOpen, label: 'RAG Retrieval',   desc: 'Questions from your notes via semantic search', col: 'var(--color-primary)', dim: 'var(--color-primary-dim)', border: 'var(--color-primary-border)' },
  { icon: Mic,      label: 'AI Evaluation',   desc: 'Gemini grades your answers in real-time',       col: 'var(--color-accent)', dim: 'var(--color-accent-dim)', border: 'var(--color-accent-border)' },
  { icon: BarChart3,label: 'Detailed Report', desc: 'Score, feedback & improvement suggestions',     col: 'var(--color-purple)', dim: 'var(--color-purple-dim)', border: 'var(--color-purple-border)' },
];
const Pill = ({ active, col, onClick, children }) => {
  const isAccent = col === 'var(--color-accent)';
  const dimColor = isAccent ? 'var(--color-accent-dim)' : 'var(--color-primary-dim)';
  const borderColor = isAccent ? 'var(--color-accent-border)' : 'var(--color-primary-border)';
  return (
    <button onClick={onClick} style={{
      padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-md)',
      border: `1px solid ${active ? borderColor : 'var(--border-strong)'}`,
      background: active ? dimColor : 'var(--bg-elevated)',
      color: active ? col : 'var(--text-secondary)',
      fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.8125rem',
      cursor: 'pointer', transition: 'all var(--transition)',
    }}>{children}</button>
  );
};
const MockViva = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('DSA');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const start = async () => {
    try {
      setLoading(true); setError(null);
      const res = await API.post('/viva/start', { subject, difficulty, question_count: questionCount });
      navigate('/viva/session', {
        state: { vivaId: res.data.viva_id, firstQuestion: res.data.first_question, totalQuestions: res.data.total_questions, subject: res.data.subject, difficulty: res.data.difficulty }
      });
    } catch (err) { setError(err.response?.data?.detail || 'Failed to start. Upload notes for this subject first.'); }
    finally { setLoading(false); }
  };
  return (
    <DashboardLayout currentPage="AI Mock Viva">
      <div style={{ maxWidth: '36rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--color-accent-dim) 0%, transparent 70%)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifycontent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div className="animate-float" style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-md)', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifycontent: 'center' }}>
                <Mic size={18} color="var(--btn-primary-text)" />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem' }}>AI Mock Viva</h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RAG-powered oral exam from your notes</p>
              </div>
            </div>
            <button onClick={() => navigate('/viva/history')} className="btn btn-ghost btn-sm">
              <History size={13} /> History
            </button>
          </div>
          {/* How it works */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {HOW.map(h => (
              <div key={h.label} style={{ padding: '1.125rem 0.875rem', textAlign: 'center', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)', background: h.dim, border: `1px solid ${h.border}`, display: 'flex', alignItems: 'center', justifycontent: 'center' }}>
                  <h.icon size={13} style={{ color: h.col }} />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)' }}>{h.label}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Config */}
        <Reveal variant="up" delay={50}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Subject */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.625rem' }}><BookOpen size={12} /> Subject</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SUBJECTS.map(s => <Pill key={s} active={subject === s} col="var(--color-accent)" onClick={() => setSubject(s)}>{s}</Pill>)}
              </div>
            </div>
            {/* Difficulty */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.625rem' }}><Zap size={12} /> Difficulty</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.625rem' }}>
                {DIFFICULTIES.map(d => (
                  <button key={d.label} onClick={() => setDifficulty(d.label)} style={{
                    padding: '0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${difficulty === d.label ? d.color : 'var(--border-strong)'}`,
                    background: difficulty === d.label ? d.dim : 'var(--bg-elevated)',
                    color: difficulty === d.label ? d.color : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all var(--transition)', textAlign: 'left',
                  }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8125rem' }}>{d.label}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.65, marginTop: '0.125rem' }}>{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Count */}
            <div>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.625rem' }}><Clock size={12} /> Questions</label>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                {COUNTS.map(n => <Pill key={n} active={questionCount === n} col="var(--color-primary)" onClick={() => setQuestionCount(n)}>{n} Qs</Pill>)}
              </div>
            </div>
          </div>
        </Reveal>
        {/* Preview */}
        <Reveal variant="up" delay={100}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--color-accent-border)', borderRadius: 'var(--radius-lg)', padding: '1.125rem 1.25rem' }}>
            <p className="label" style={{ marginBottom: '0.75rem' }}>Session Preview</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' }}>
              {[
                { l: 'Subject', v: subject },
                { l: 'Level', v: difficulty },
                { l: 'Questions', v: `${questionCount}` },
                { l: 'Est. Time', v: `~${questionCount * 3}m` },
              ].map(p => (
                <div key={p.l} style={{ textAlign: 'center', padding: '0.625rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <div className="label" style={{ marginBottom: '0.25rem' }}>{p.l}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.v}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        {error && <div className="alert alert-error"><AlertCircle size={15} style={{ flexShrink: 0 }} />{error}</div>}
        <Reveal variant="up" delay={150}>
          <button id="start-viva-btn" onClick={start} disabled={loading} className="btn btn-xl btn-block"
            style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))', color: 'var(--btn-primary-text)', border: 'none', fontWeight: 800 }}
          >
            {loading
              ? <><span style={{ width: '1.125rem', height: '1.125rem', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid var(--btn-primary-text)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Generating Questions…</>
              : <><Mic size={18} /> Start Mock Viva <ChevronRight size={18} /></>
            }
          </button>
        </Reveal>
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Questions generated exclusively from your uploaded notes via RAG semantic search.
        </p>
      </div>
    </DashboardLayout>
  );
};
export default MockViva;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BrainCircuit, Play, AlertCircle, History } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import API from '../api/axios';
import Reveal from '../components/Reveal';
const SUBJECTS = ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude', 'Other'];
const DIFFICULTIES = [
  { label: 'Easy',   desc: 'Basic recall', col: 'var(--color-accent)', dim: 'var(--color-accent-dim)' },
  { label: 'Medium', desc: 'Applied',      col: 'var(--color-primary)', dim: 'var(--color-primary-dim)' },
  { label: 'Hard',   desc: 'Edge cases',   col: 'var(--color-danger)', dim: 'var(--color-danger-dim)' },
];
const COUNTS = [5, 10, 20];
const TYPES = [
  { value: 'MCQ',          label: 'MCQ',          icon: '☑', desc: '4-choice single answer' },
  { value: 'Short Answer', label: 'Short Answer',  icon: '✏', desc: 'Written, AI graded' },
  { value: 'Mixed',        label: 'Mixed Mode',    icon: '⚡', desc: 'MCQ + Short hybrid' },
];
const STEPS = ['Searching ChromaDB…', 'Extracting context…', 'Consulting Gemini…', 'Building questions…', 'Saving to DB…'];
const SelBtn = ({ active, onClick, children, col, dim }) => (
  <button onClick={onClick} style={{
    padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: `1px solid ${active ? col || 'var(--color-primary)' : 'var(--border-strong)'}`,
    background: active ? (dim || 'var(--color-primary-dim)') : 'var(--bg-elevated)',
    color: active ? (col || 'var(--color-primary)') : 'var(--text-secondary)',
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.8125rem',
    cursor: 'pointer', transition: 'all var(--transition)', textAlign: 'left',
  }}>
    {children}
  </button>
);
const QuizGenerator = () => {
  const [subject, setSubject] = useState('DSA');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(10);
  const [quizType, setQuizType] = useState('MCQ');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
    let iv;
    if (loading) {
      const t = setTimeout(() => setStep(0), 0);
      iv = setInterval(() => setStep(p => (p + 1) % STEPS.length), 2400);
      return () => {
        clearTimeout(t);
        clearInterval(iv);
      };
    }
  }, [loading]);
  const generate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) { setError('Please enter a topic.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await API.post('/quiz/generate', { subject, topic: topic.trim(), difficulty, question_count: count, quiz_type: quizType });
      navigate(`/quiz/attempt/${res.data.quiz_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Quiz generation failed. Please try again.');
    } finally { setLoading(false); }
  };
  return (
    <DashboardLayout currentPage="Quiz Generator">
      <div style={{ maxWidth: '38rem', margin: '0 auto' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--color-primary-dim) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="var(--btn-primary-text)" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem' }}>AI Quiz Generator</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Questions from your uploaded notes</p>
              </div>
            </div>
            <a href="#/quiz/history" className="btn btn-ghost btn-sm">
              <History size={13} /> History
            </a>
          </div>
          {loading ? (
            <div style={{ padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center' }}>
              <div className="animate-float" style={{ position: 'relative' }}>
                <div style={{ width: '4rem', height: '4rem', borderRadius: 'var(--radius-lg)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
                  <BrainCircuit size={24} color="var(--btn-primary-text)" />
                </div>
                <div style={{ position: 'absolute', inset: '-4px', border: '2px solid var(--color-primary-border)', borderRadius: 'var(--radius-xl)', animation: 'pulse-glow 2s infinite' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Generating Your Quiz</h3>
                <p style={{ color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 500, animation: 'fadeIn 0.5s' }}>{STEPS[step]}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>15–30 seconds depending on note size</p>
              </div>
              {/* Step dots */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{ height: '5px', borderRadius: '100px', transition: 'all 0.3s', background: i === step ? 'var(--color-primary)' : 'var(--border)', width: i === step ? '1.5rem' : '5px' }} />
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={generate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {error && (
                <div className="alert alert-error">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}
              {/* Subject + Topic */}
              <Reveal variant="up" delay={50}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Subject</label>
                    <select value={subject} onChange={e => setSubject(e.target.value)} className="input-field" style={{ cursor: 'pointer', background: 'var(--bg-elevated)' }}>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Topic</label>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. AVL Trees…" className="input-field" />
                  </div>
                </div>
              </Reveal>
              {/* Difficulty */}
              <Reveal variant="up" delay={100}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Difficulty</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.625rem' }}>
                    {DIFFICULTIES.map(d => (
                      <SelBtn key={d.label} active={difficulty === d.label} onClick={() => setDifficulty(d.label)} col={d.col} dim={d.dim}>
                        <div style={{ fontWeight: 700 }}>{d.label}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.65, marginTop: '0.125rem' }}>{d.desc}</div>
                      </SelBtn>
                    ))}
                  </div>
                </div>
              </Reveal>
              {/* Count */}
              <Reveal variant="up" delay={150}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Questions</label>
                  <div style={{ display: 'flex', gap: '0.625rem' }}>
                    {COUNTS.map(n => (
                      <SelBtn key={n} active={count === n} onClick={() => setCount(n)}>
                        <span style={{ display: 'flex', justifyContent: 'center', fontWeight: 700 }}>{n}</span>
                      </SelBtn>
                    ))}
                  </div>
                </div>
              </Reveal>
              {/* Quiz Type */}
              <Reveal variant="up" delay={200}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Mode</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.625rem' }}>
                    {TYPES.map(t => (
                      <SelBtn key={t.value} active={quizType === t.value} onClick={() => setQuizType(t.value)}>
                        <div style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{t.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{t.label}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '0.125rem' }}>{t.desc}</div>
                      </SelBtn>
                    ))}
                  </div>
                </div>
              </Reveal>
              <div className="divider" />
              <Reveal variant="up" delay={250}>
                <button type="submit" className="btn btn-primary btn-block btn-lg">
                  <Play size={16} /> Generate & Start Quiz
                </button>
              </Reveal>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default QuizGenerator;
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, ChevronLeft, ChevronRight, Send, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import API from '../api/axios';

const QuizAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await API.get(`/quiz/${id}`);
        setQuiz(r.data);
        setTimeLeft(r.data.questions.length * 120);
      } catch { setError('Failed to load quiz. It may not exist or belong to you.'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const submitRef = useRef();
  
  const submit = async (timeout = false) => {
    if (!quiz || submitting) return;
    setSubmitting(true); setError('');
    const payload = quiz.questions.map(q => ({ question_id: q.question_id, selected_answer: answers[q.question_id] || '' }));
    try {
      const r = await API.post('/quiz/submit', { quiz_id: quiz.quiz_id, answers: payload });
      const resultId = r.data.result_id;
      navigate(`/quiz/result/${resultId}`, { state: { result: r.data, quizDetails: quiz, timeTaken: formatTime(quiz.questions.length*120 - timeLeft) } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  submitRef.current = submit;

  useEffect(() => {
    if (loading || !quiz || timeLeft <= 0 || submitting) return;
    const timer = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(timer);
          if (submitRef.current) {
            submitRef.current(true);
          }
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, quiz, submitting]);

  const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

  if (loading) return (
    <DashboardLayout currentPage="Quiz Attempt">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '6rem 0' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '2px solid var(--amber-dim)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading quiz questions…</p>
      </div>
    </DashboardLayout>
  );

  if (error || !quiz) return (
    <DashboardLayout currentPage="Quiz Attempt">
      <div style={{ maxWidth: '24rem', margin: '4rem auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <AlertCircle size={32} style={{ color: '#f87171' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Error Loading Quiz</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{error || 'Quiz not found.'}</p>
        <button onClick={() => navigate('/quiz/history')} className="btn btn-ghost">Back to History</button>
      </div>
    </DashboardLayout>
  );

  const q = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;
  const urgent = timeLeft < 60;

  return (
    <DashboardLayout currentPage={`Quiz: ${quiz.topic}`}>
      {/* Submitting overlay */}
      {submitting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(8px)', zIndex: 99, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
          <div style={{ width: '3.5rem', height: '3.5rem', background: 'var(--amber)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 1.5s ease-in-out infinite' }}>
            <CheckCircle2 size={22} color="#0a0a0f" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Grading with AI Tutor</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Evaluating submissions and compiling feedback…</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 14rem', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Quiz header */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-amber">{quiz.subject}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{quiz.quiz_type}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.875rem', background: urgent ? 'rgba(239,68,68,0.1)' : 'var(--bg-elevated)', border: `1px solid ${urgent ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, borderRadius: '100px', animation: urgent ? 'pulse-glow 1s infinite' : 'none' }}>
              <Clock size={13} style={{ color: urgent ? '#f87171' : 'var(--text-secondary)' }} />
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: urgent ? '#f87171' : 'var(--text-primary)' }}>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <ProgressBar current={currentIndex + 1} total={quiz.questions.length} />
          <QuestionCard question={q} index={currentIndex} total={quiz.questions.length} selectedAnswer={answers[q.question_id]} onChange={sel => setAnswers(p => ({ ...p, [q.question_id]: sel }))} mode="attempt" />

          {/* Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentIndex(p => Math.max(0, p - 1))} disabled={currentIndex === 0}
              className="btn btn-ghost"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            {isLast ? (
              <button onClick={() => submit()} className="btn btn-primary" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
                <Send size={14} /> Submit Quiz
              </button>
            ) : (
              <button onClick={() => setCurrentIndex(p => Math.min(quiz.questions.length - 1, p + 1))} className="btn btn-ghost">
                Next <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Side overview */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem' }}>
          <p className="label">Questions Overview</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.375rem' }}>
            {quiz.questions.map((q2, idx) => {
              const answered = answers[q2.question_id]?.trim();
              const current = idx === currentIndex;
              return (
                <button key={idx} onClick={() => setCurrentIndex(idx)} style={{
                  height: '2.25rem', borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${current ? 'var(--amber)' : answered ? 'rgba(45,212,191,0.3)' : 'var(--border)'}`,
                  background: current ? 'var(--amber-dim)' : answered ? 'var(--teal-dim)' : 'var(--bg-elevated)',
                  color: current ? 'var(--amber)' : answered ? 'var(--teal)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem',
                  cursor: 'pointer', transition: 'all var(--transition)',
                  transform: current ? 'scale(1.05)' : 'none',
                }}>{idx + 1}</button>
              );
            })}
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {[
              { col: 'var(--amber)', label: 'Current' },
              { col: 'var(--teal)', label: 'Answered' },
              { col: 'var(--text-muted)', label: 'Unanswered' },
            ].map(k => (
              <div key={k.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: k.col + '30', border: `1px solid ${k.col}50` }} />
                {k.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuizAttempt;

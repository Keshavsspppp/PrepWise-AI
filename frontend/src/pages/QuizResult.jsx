import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, HelpCircle, ChevronLeft, ChevronRight, RotateCcw, Home } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import ScoreCard from '../components/ScoreCard';
import ResultAnalysis from '../components/ResultAnalysis';
import QuestionCard from '../components/QuestionCard';
import API from '../api/axios';

const QuizResult = () => {
  const { state } = useLocation();
  const { resultId } = useParams();
  const navigate = useNavigate();
  
  const [result, setResult] = useState(state?.result || null);
  const [quizDetails, setQuizDetails] = useState(state?.quizDetails || null);
  const [timeTaken, setTimeTaken] = useState(state?.timeTaken || 'N/A');
  const [loading, setLoading] = useState(!state?.result);
  const [error, setError] = useState(null);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    if (state?.result) {
      setLoading(false);
      return;
    }
    
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/quiz/result/${resultId}`);
        setResult(res.data);
        setQuizDetails(res.data.quiz_details);
        setTimeTaken('N/A');
      } catch (err) {
        console.error("Failed to fetch quiz result:", err);
        setError("Failed to load quiz results.");
      } finally {
        setLoading(false);
      }
    };
    
    if (resultId) {
      fetchResult();
    } else {
      setLoading(false);
    }
  }, [resultId, state]);

  if (loading) return (
    <DashboardLayout currentPage="Quiz Results">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '6rem 0' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '2px solid var(--amber-dim)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading quiz results…</p>
      </div>
    </DashboardLayout>
  );

  if (error || !result || !quizDetails) return (
    <DashboardLayout currentPage="Quiz Results">
      <div style={{ maxWidth: '24rem', margin: '4rem auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <AlertCircle size={32} style={{ color: 'var(--amber)' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No Results Found</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{error || "Please complete a quiz to see results, or check your history."}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          <button onClick={() => navigate('/quiz/history')} className="btn btn-primary btn-block">Quiz History</button>
          <button onClick={() => navigate('/quiz/generator')} className="btn btn-ghost btn-block">New Quiz</button>
        </div>
      </div>
    </DashboardLayout>
  );

  const allEvaluations = [...result.correct_answers, ...result.wrong_answers];
  const origIds = quizDetails.questions.map(q => q.question_id);
  allEvaluations.sort((a, b) => origIds.indexOf(a.question_id) - origIds.indexOf(b.question_id));
  const cur = allEvaluations[reviewIndex];

  return (
    <DashboardLayout currentPage={`Result: ${quizDetails.topic}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <ScoreCard score={result.score} total={result.total} percentage={result.percentage} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 18rem', gap: '1.5rem', alignItems: 'start' }}>
          {/* Main review */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p className="label">Question Review</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Time: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{timeTaken || 'N/A'}</span>
              </span>
            </div>

            {cur && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <QuestionCard
                  question={{ question: cur.question, options: quizDetails.questions.find(q => q.question_id === cur.question_id)?.options || [], correct_answer: cur.correct_answer }}
                  index={reviewIndex} total={allEvaluations.length}
                  selectedAnswer={cur.selected_answer} onChange={() => {}} mode="review"
                />
                {/* Explanation */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', gap: '1rem' }}>
                  <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HelpCircle size={14} style={{ color: 'var(--amber)' }} />
                  </div>
                  <div>
                    <p className="label" style={{ marginBottom: '0.375rem' }}>AI Explanation</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{cur.explanation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Review nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button disabled={reviewIndex === 0} onClick={() => setReviewIndex(p => p - 1)} className="btn btn-ghost">
                <ChevronLeft size={14} /> Previous
              </button>
              <button disabled={reviewIndex === allEvaluations.length - 1} onClick={() => setReviewIndex(p => p + 1)} className="btn btn-ghost">
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem' }}>
            <ResultAnalysis feedback={result.feedback} score={result.score} total={result.total} />

            {/* Nav grid */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.125rem' }}>
              <p className="label" style={{ marginBottom: '0.75rem' }}>Review Navigation</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.375rem', marginBottom: '0.75rem' }}>
                {allEvaluations.map((ev, idx) => (
                  <button key={idx} onClick={() => setReviewIndex(idx)} style={{
                    height: '2.25rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all var(--transition)',
                    border: `1px solid ${idx === reviewIndex ? 'var(--amber)' : ev.is_correct ? 'rgba(45,212,191,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    background: idx === reviewIndex ? 'var(--amber-dim)' : ev.is_correct ? 'var(--teal-dim)' : 'rgba(239,68,68,0.08)',
                    color: idx === reviewIndex ? 'var(--amber)' : ev.is_correct ? 'var(--teal)' : '#f87171',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem',
                    transform: idx === reviewIndex ? 'scale(1.05)' : 'none',
                  }}>{idx + 1}</button>
                ))}
              </div>
              <div className="divider" style={{ marginBottom: '0.75rem' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => navigate('/quiz/generator')} className="btn btn-primary btn-block">
                  <RotateCcw size={14} /> New Quiz
                </button>
                <button onClick={() => navigate('/dashboard')} className="btn btn-ghost btn-block">
                  <Home size={14} /> Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuizResult;

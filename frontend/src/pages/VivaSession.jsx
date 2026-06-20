import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import VivaQuestionCard from '../components/VivaQuestionCard';
import AnswerInput from '../components/AnswerInput';
import FeedbackCard from '../components/FeedbackCard';
import VivaTimer from '../components/VivaTimer';
import { ArrowLeft, ChevronRight, CheckCircle2, Loader2, Flag, Mic } from 'lucide-react';
const VivaSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  useEffect(() => { if (!state?.vivaId) navigate('/viva'); }, [state, navigate]);
  const [currentQuestion, setCurrentQuestion] = useState(state?.firstQuestion || null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions] = useState(state?.totalQuestions || 5);
  const [vivaId] = useState(state?.vivaId || '');
  const [subject] = useState(state?.subject || '');
  const [difficulty] = useState(state?.difficulty || 'Medium');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [nextQuestion, setNextQuestion] = useState(null);
  const [phase, setPhase] = useState('answering');
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentQuestion) return;
    try {
      setSubmitting(true); setError(null); setTimerPaused(true);
      const res = await API.post('/viva/answer', {
        viva_id: vivaId, question_id: currentQuestion.question_id, answer: answer.trim()
      });
      setFeedback({ ...res.data.evaluation, question_number: questionNumber });
      setNextQuestion(res.data.next_question);
      setPhase('feedback');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit answer. Please try again.');
    } finally { setSubmitting(false); }
  };
  const handleNextQuestion = () => {
    if (!feedback) return;
    setCurrentQuestion(nextQuestion);
    setAnswer(''); setFeedback(null); setTimerPaused(false); setPhase('answering');
  };
  const handleCompleteViva = async () => {
    try {
      setCompleting(true);
      const res = await API.post('/viva/complete', { viva_id: vivaId });
      navigate('/viva/results', { state: { results: res.data, vivaId } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete viva session.');
      setCompleting(false);
    }
  };
  if (!state?.vivaId) return null;
  const diffCol = difficulty === 'Easy' ? 'var(--color-accent)' : difficulty === 'Hard' ? 'var(--color-danger)' : 'var(--color-primary)';
  return (
    <DashboardLayout currentPage="Viva Session">
      <div style={{ maxWidth: '42rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button onClick={() => navigate('/viva')} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem' }} aria-label="Back to Mock Viva">
              <ArrowLeft size={14} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic size={13} style={{ color: 'var(--color-accent)' }} />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{subject} Viva</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: diffCol, fontWeight: 600 }}>{difficulty}</span> · {totalQuestions} Questions
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <VivaTimer paused={timerPaused} />
            {/* Progress counter */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
              <div style={{ display: 'flex', gap: '3px' }}>
                {[...Array(totalQuestions)].map((_, i) => (
                  <div key={i} style={{ width: '18px', height: '4px', borderRadius: '100px', background: i < questionNumber ? 'var(--color-accent)' : i === questionNumber - 1 ? 'var(--color-primary)' : 'var(--border)', transition: 'all 0.3s' }} />
                ))}
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{questionNumber}/{totalQuestions}</span>
            </div>
          </div>
        </div>
        {error && (
          <div className="alert alert-error">
            <p style={{ fontSize: '0.875rem' }}>{error}</p>
          </div>
        )}
        {/* Question */}
        {currentQuestion && (
          <VivaQuestionCard
            question={currentQuestion.question}
            question_type={currentQuestion.question_type}
            question_number={questionNumber}
            total_questions={totalQuestions}
            subject={subject}
            difficulty={difficulty}
          />
        )}
        {/* Answer input */}
        {phase === 'answering' && (
          <AnswerInput
            value={answer}
            onChange={setAnswer}
            onSubmit={handleSubmitAnswer}
            disabled={submitting}
            placeholder="Explain your answer clearly. Be thorough and use correct terminology..."
          />
        )}
        {/* Evaluating state */}
        {submitting && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', border: '2px solid var(--color-accent-dim)', borderTop: '2px solid var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Evaluating with Gemini AI…</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Grounding answer against your study notes</p>
            </div>
          </div>
        )}
        {/* Feedback */}
        {phase === 'feedback' && feedback && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <FeedbackCard {...feedback} />
            {questionNumber < totalQuestions ? (
              <button
                onClick={() => {
                  setQuestionNumber(n => n + 1);
                  handleNextQuestion();
                }}
                className="btn btn-accent btn-block btn-lg"
              >
                Next Question <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleCompleteViva} disabled={completing}
                className="btn btn-block btn-lg"
                style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))', color: 'var(--btn-primary-text)', border: 'none', fontWeight: 800 }}
              >
                {completing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {completing ? 'Completing…' : 'Complete Viva & View Results'}
              </button>
            )}
            {questionNumber < totalQuestions && (
              <div style={{ textAlign: 'center' }}>
                <button onClick={handleCompleteViva} disabled={completing} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'underline',
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                }}>
                  <Flag size={12} /> End session early & view results
                </button>
              </div>
            )}
          </div>
        )}
        {/* Loading next question */}
        {phase === 'answering' && !currentQuestion && questionNumber > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--color-accent-dim)', borderTop: '2px solid var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading next question…</p>
            <button onClick={handleCompleteViva} disabled={completing} className="btn btn-accent btn-sm">
              <CheckCircle2 size={14} /> View My Results
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
export default VivaSession;
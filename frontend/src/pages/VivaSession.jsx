import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import VivaQuestionCard from '../components/VivaQuestionCard';
import AnswerInput from '../components/AnswerInput';
import FeedbackCard from '../components/FeedbackCard';
import VivaTimer from '../components/VivaTimer';
import { ArrowLeft, ChevronRight, CheckCircle2, Loader2, Flag } from 'lucide-react';

const VivaSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;

  // Redirect if no state (direct URL access)
  useEffect(() => {
    if (!state?.vivaId) navigate('/viva');
  }, [state, navigate]);

  const [currentQuestion, setCurrentQuestion] = useState(state?.firstQuestion || null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions] = useState(state?.totalQuestions || 5);
  const [vivaId] = useState(state?.vivaId || '');
  const [subject] = useState(state?.subject || '');
  const [difficulty] = useState(state?.difficulty || 'Medium');

  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [phase, setPhase] = useState('answering'); // answering | feedback | complete
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [timerPaused, setTimerPaused] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !currentQuestion) return;
    try {
      setSubmitting(true);
      setError(null);
      setTimerPaused(true);
      const res = await API.post('/viva/answer', {
        viva_id: vivaId,
        question_id: currentQuestion.question_id,
        answer: answer.trim()
      });
      setFeedback({ ...res.data.evaluation, question_number: questionNumber });
      setPhase('feedback');
      if (res.data.viva_complete) {
        // All questions answered
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!feedback) return;
    const nextQ = null; // Will be populated from feedback's next_question
    // Actually stored in API response via submit
    setAnswer('');
    setFeedback(null);
    setTimerPaused(false);
    setPhase('answering');
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

  return (
    <DashboardLayout currentPage="Viva Session">
      <div className="max-w-2xl mx-auto">
        {/* Session header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/viva')}
              className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-all cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-sm font-bold text-white">{subject} Viva</p>
              <p className="text-[10px] text-slate-500">{difficulty} · {totalQuestions} Questions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <VivaTimer paused={timerPaused} />
            <div className="text-xs font-bold text-slate-400">
              {questionNumber}<span className="text-slate-600">/{totalQuestions}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Question */}
        {currentQuestion && (
          <div className="mb-4">
            <VivaQuestionCard
              question={currentQuestion.question}
              question_type={currentQuestion.question_type}
              question_number={questionNumber}
              total_questions={totalQuestions}
              subject={subject}
              difficulty={difficulty}
            />
          </div>
        )}

        {/* Answer phase */}
        {phase === 'answering' && (
          <AnswerInput
            value={answer}
            onChange={setAnswer}
            onSubmit={handleSubmitAnswer}
            disabled={submitting}
            placeholder={`Explain your answer clearly. Be thorough and use correct terminology...`}
          />
        )}

        {/* Submitting */}
        {submitting && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-sm text-slate-400 font-medium">Evaluating your answer with AI...</span>
          </div>
        )}

        {/* Feedback phase */}
        {phase === 'feedback' && feedback && (
          <div className="space-y-4">
            <FeedbackCard {...feedback} />

            {/* Navigation buttons */}
            <div className="flex gap-3">
              {questionNumber < totalQuestions ? (
                <button
                  onClick={async () => {
                    // Load next question from the API response we need to re-fetch session
                    try {
                      const sessionRes = await API.get(`/viva/results/${vivaId}`).catch(() => null);
                      // Fallback: advance question number and refetch from history
                      setQuestionNumber(n => n + 1);
                      setCurrentQuestion(null); // Will trigger completion
                      handleNextQuestion();
                    } catch {
                      setQuestionNumber(n => n + 1);
                      handleNextQuestion();
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-bold rounded-2xl transition-all cursor-pointer">
                  Next Question <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={handleCompleteViva} disabled={completing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50">
                  {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {completing ? 'Completing...' : 'Complete Viva & View Results'}
                </button>
              )}
            </div>

            {/* Finish early */}
            {questionNumber < totalQuestions && (
              <div className="text-center">
                <button onClick={handleCompleteViva} disabled={completing}
                  className="text-[10px] text-slate-600 hover:text-slate-400 font-medium underline cursor-pointer transition-colors">
                  <Flag className="h-3 w-3 inline mr-1" />End session early & view results
                </button>
              </div>
            )}
          </div>
        )}

        {/* Show next question prompt after advancing */}
        {phase === 'answering' && !currentQuestion && questionNumber > 1 && (
          <div className="py-12 flex flex-col items-center text-center">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-3" />
            <p className="text-sm text-slate-400">Loading next question...</p>
            <button onClick={handleCompleteViva} disabled={completing}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl cursor-pointer">
              <CheckCircle2 className="h-4 w-4" /> View My Results
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VivaSession;

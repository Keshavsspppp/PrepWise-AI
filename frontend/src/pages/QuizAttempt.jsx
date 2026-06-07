import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle2, ChevronLeft, ChevronRight, Send } from 'lucide-react';
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
  const [answers, setAnswers] = useState({}); // mapping question_id -> selected_answer
  const [timeLeft, setTimeLeft] = useState(0); // in seconds

  // Fetch quiz details on mount
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/quiz/${id}`);
        setQuiz(response.data);
        // 2 minutes per question
        setTimeLeft(response.data.questions.length * 120);
      } catch (err) {
        console.error('Failed to fetch quiz:', err);
        setError('Failed to load quiz questions. Please check if the quiz exists and belongs to you.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  // Handle countdown timer
  useEffect(() => {
    if (loading || !quiz || timeLeft <= 0 || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, quiz, timeLeft, submitting]);

  const handleAnswerChange = (selected) => {
    const currentQuestionId = quiz.questions[currentIndex].question_id;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionId]: selected
    }));
  };

  const handleAutoSubmit = () => {
    handleSubmitAnswers(true);
  };

  const handleSubmitAnswers = async (isTimeOut = false) => {
    if (!quiz || submitting) return;

    setSubmitting(true);
    setError('');

    // Format answers payload
    const answersPayload = quiz.questions.map((q) => ({
      question_id: q.question_id,
      selected_answer: answers[q.question_id] || ''
    }));

    try {
      const response = await API.post('/quiz/submit', {
        quiz_id: id,
        answers: answersPayload
      });

      // Redirect to results page, passing evaluation and quiz details in router state
      navigate(`/quiz/result`, {
        state: {
          result: response.data,
          quizDetails: quiz,
          timeTaken: formatTimeTaken()
        }
      });
    } catch (err) {
      console.error('Quiz submission failed:', err);
      let errMsg = 'Failed to submit quiz. Please try again.';
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      }
      setError(errMsg);
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatTimeTaken = () => {
    if (!quiz) return '0:00';
    const totalTime = quiz.questions.length * 120;
    const taken = totalTime - timeLeft;
    return formatTime(taken);
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="Quiz Attempt">
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center animate-spin">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-400">Loading quiz questions...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !quiz) {
    return (
      <DashboardLayout currentPage="Quiz Attempt">
        <div className="max-w-md mx-auto p-6 bg-slate-900/30 border border-slate-800 rounded-3xl text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-white">Error Loading Quiz</h3>
          <p className="text-xs text-slate-450">{error || 'Quiz not found.'}</p>
          <button
            onClick={() => navigate('/quiz/history')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Go back to Planner
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  return (
    <DashboardLayout currentPage={`Attempting Quiz: ${quiz.topic}`}>
      {submitting && (
        <div className="fixed inset-0 bg-dark-bg/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
          <div className="h-12 w-12 rounded-xl bg-neon-gradient text-white flex items-center justify-center animate-spin shadow-lg">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-1 text-center">
            <h3 className="text-lg font-bold text-white">Grading with AI Tutor</h3>
            <p className="text-xs text-slate-400">Evaluating your submissions and compiling feedback...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Quiz Area */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          {/* Header Dashboard panel */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950/20 px-2.5 py-1 rounded-sm uppercase tracking-wider">
                {quiz.subject}
              </span>
              <span className="text-xs font-bold text-slate-400">
                Mode: {quiz.quiz_type}
              </span>
            </div>
            
            {/* Timer component */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${timeLeft < 60 ? 'border-red-500/20 bg-red-950/10 text-red-400 animate-pulse' : 'border-slate-850 bg-slate-900/60 text-slate-300'}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono text-sm font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <ProgressBar current={currentIndex + 1} total={quiz.questions.length} />

          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            total={quiz.questions.length}
            selectedAnswer={answers[currentQuestion.question_id]}
            onChange={handleAnswerChange}
            mode="attempt"
          />

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-4.5 py-3 rounded-2xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 text-sm font-bold text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-default transition-all"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={() => handleSubmitAnswers()}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-neon-gradient text-white hover:opacity-95 font-bold text-sm shadow-md shadow-primary/20 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4.5 py-3 rounded-2xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 text-sm font-bold text-slate-300 hover:text-white cursor-pointer transition-all"
              >
                Next
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* Side Question Navigation Grid */}
        <div className="space-y-6">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 shadow-sm backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Questions Overview</h3>
            <div className="grid grid-cols-5 gap-2.5">
              {quiz.questions.map((q, idx) => {
                const isAnswered = answers[q.question_id] && answers[q.question_id].trim() !== '';
                const isCurrent = idx === currentIndex;
                
                let btnClass = 'bg-slate-950/40 border-slate-850 text-slate-500 hover:border-slate-700 hover:text-white';
                if (isAnswered) {
                  btnClass = 'bg-indigo-950/20 border-indigo-500/40 text-indigo-400';
                }
                if (isCurrent) {
                  btnClass = 'bg-slate-800 border-indigo-500 text-white font-bold scale-105';
                }
                
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="pt-4 border-t border-slate-800/40 flex flex-col gap-2 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-indigo-950/20 border border-indigo-500/40"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-slate-950/40 border border-slate-850"></div>
                <span>Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuizAttempt;

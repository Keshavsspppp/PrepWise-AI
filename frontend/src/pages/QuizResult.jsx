import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, HelpCircle, ChevronRight, CheckCircle2, XCircle, RotateCcw, Home, Sparkles } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import ScoreCard from '../components/ScoreCard';
import ResultAnalysis from '../components/ResultAnalysis';
import QuestionCard from '../components/QuestionCard';

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract evaluation data from router location state
  const { result, quizDetails, timeTaken } = location.state || {};
  const [reviewIndex, setReviewIndex] = useState(0);

  if (!result || !quizDetails) {
    return (
      <DashboardLayout currentPage="Quiz Results">
        <div className="max-w-md mx-auto p-6 bg-slate-900/30 border border-slate-800 rounded-3xl text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto animate-pulse" />
          <h3 className="text-base font-bold text-white">No Results Found</h3>
          <p className="text-xs text-slate-450">
            It looks like you refreshed the page or navigated here directly. Please complete a quiz or review your attempts history to inspect results.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => navigate('/quiz/history')}
              className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Go to Quiz History
            </button>
            <button
              onClick={() => navigate('/quiz/generator')}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer border border-slate-750"
            >
              Generate New Quiz
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Combine correct and wrong answers in order to present a chronological review list
  const allEvaluations = [...result.correct_answers, ...result.wrong_answers];
  // Sort evaluations by matching question index in the original quiz questions list
  const originalIds = quizDetails.questions.map(q => q.question_id);
  allEvaluations.sort((a, b) => originalIds.indexOf(a.question_id) - originalIds.indexOf(b.question_id));

  const currentReview = allEvaluations[reviewIndex];

  return (
    <DashboardLayout currentPage={`Quiz Result Analysis: ${quizDetails.topic}`}>
      <div className="space-y-8">
        {/* Visual score details */}
        <ScoreCard 
          score={result.score} 
          total={result.total} 
          percentage={result.percentage} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Review Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Question Review & Explanations
              </h3>
              <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Time taken: <span className="text-white font-mono">{timeTaken || 'N/A'}</span>
              </div>
            </div>

            {/* Current Question Review Card */}
            {currentReview && (
              <div className="space-y-4">
                <QuestionCard
                  question={{
                    question: currentReview.question,
                    options: quizDetails.questions.find(q => q.question_id === currentReview.question_id)?.options || [],
                    correct_answer: currentReview.correct_answer
                  }}
                  index={reviewIndex}
                  total={allEvaluations.length}
                  selectedAnswer={currentReview.selected_answer}
                  onChange={() => {}}
                  mode="review"
                />

                {/* Explanation Card */}
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 shadow-sm backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-400 flex-shrink-0">
                      <HelpCircle className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-450 uppercase tracking-wider block">AI Explanation</span>
                      <p className="text-sm text-slate-300 leading-relaxed mt-1.5">
                        {currentReview.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next/Prev Review Navigation controls */}
            <div className="flex justify-between items-center">
              <button
                disabled={reviewIndex === 0}
                onClick={() => setReviewIndex(prev => prev - 1)}
                className="px-4 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-default transition-all"
              >
                Previous Question
              </button>
              <button
                disabled={reviewIndex === allEvaluations.length - 1}
                onClick={() => setReviewIndex(prev => prev + 1)}
                className="px-4 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-default transition-all"
              >
                Next Question
              </button>
            </div>
          </div>

          {/* Side Feedback Panel & Grid overview */}
          <div className="space-y-6">
            
            {/* Feedback evaluation */}
            <ResultAnalysis 
              feedback={result.feedback} 
              score={result.score} 
              total={result.total} 
            />

            {/* Quick Navigation grid */}
            <div className="bg-slate-900/35 border border-slate-800/85 rounded-3xl p-6 shadow-sm backdrop-blur-md space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Navigation</h4>
              <div className="grid grid-cols-5 gap-2.5">
                {allEvaluations.map((ev, idx) => {
                  const isCorrect = ev.is_correct;
                  const isCurrent = idx === reviewIndex;
                  
                  let borderClass = 'border-slate-850';
                  let bgClass = 'bg-slate-950/20 text-slate-450';
                  
                  if (isCorrect) {
                    bgClass = 'bg-emerald-950/15 text-emerald-450 border-emerald-900/30';
                  } else {
                    bgClass = 'bg-red-950/15 text-red-450 border-red-900/30';
                  }
                  
                  if (isCurrent) {
                    borderClass = 'border-indigo-500 scale-105 font-bold';
                  }
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setReviewIndex(idx)}
                      className={`h-10 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer ${bgClass} ${borderClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dashboard / Retake options */}
            <div className="bg-slate-900/35 border border-slate-800/85 rounded-3xl p-4 flex flex-col gap-2.5 backdrop-blur-md">
              <button
                onClick={() => navigate('/quiz/generator')}
                className="w-full py-3.5 rounded-2xl bg-neon-gradient text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                Retake Another Quiz
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-350 hover:text-white font-bold text-xs uppercase tracking-wider transition-all border border-slate-750 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="h-4 w-4" />
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuizResult;

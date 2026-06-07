import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BrainCircuit, Play, AlertCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import API from '../api/axios';

const QuizGenerator = () => {
  const [subject, setSubject] = useState('DSA');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [quizType, setQuizType] = useState('MCQ');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);

  const navigate = useNavigate();

  const subjects = ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude', 'Other'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const quizTypes = [
    { label: 'Multiple Choice (MCQ)', value: 'MCQ' },
    { label: 'Short Answer', value: 'Short Answer' },
    { label: 'Mixed Mode', value: 'Mixed' }
  ];
  const questionCounts = [5, 10, 20];

  const loadingSteps = [
    "Searching local ChromaDB note vectors...",
    "Extracting relevant context from PDF pages...",
    "Consulting AI generator for structured questions...",
    "Formulating answer choices and explanations...",
    "Saving quiz details securely in MongoDB..."
  ];

  // Rotate loading step texts
  React.useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please specify a topic to generate questions for.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await API.post('/quiz/generate', {
        subject,
        topic: topic.trim(),
        difficulty,
        question_count: count,
        quiz_type: quizType
      });

      const quizId = response.data.quiz_id;
      // Redirect to attempt page
      navigate(`/quiz/attempt/${quizId}`);
    } catch (err) {
      console.error('Quiz generation failed:', err);
      let errMsg = 'Failed to generate quiz. Please try again later.';
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout currentPage="Quiz Generator">
      <div className="max-w-3xl mx-auto">
        <div className="bg-dark-card/60 border border-slate-800/40 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-20 w-20 rounded-full border-2 border-indigo-500/20 animate-ping duration-1000"></div>
                <div className="h-14 w-14 rounded-2xl bg-neon-gradient text-white flex items-center justify-center shadow-lg shadow-primary/20 animate-spin">
                  <BrainCircuit className="h-7 w-7" />
                </div>
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-bold text-white tracking-tight">Generating AI Quiz</h3>
                <p className="text-sm text-cyan-400 font-semibold animate-pulse transition-all duration-300">
                  {loadingSteps[loadingStep]}
                </p>
                <p className="text-[11px] text-slate-500">This can take up to 20 seconds depending on note size.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-neon-gradient text-white">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Custom Study Quiz</h2>
                  <p className="text-xs text-slate-400">Generate personalized questions grounded strictly in your study notes.</p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-950/20 border border-red-900/30 text-red-400 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Subject dropdown */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-sm text-white focus:border-slate-700 outline-hidden cursor-pointer"
                  >
                    {subjects.map((sub) => (
                      <option key={sub} value={sub} className="bg-slate-900 text-white">
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic text input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Topic / Keyword</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. AVL Trees, Normalization Form, Deadlocks"
                    className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700 rounded-2xl p-4 text-sm text-white placeholder-slate-600 outline-hidden"
                  />
                </div>

                {/* Difficulty Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {difficulties.map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`py-3.5 rounded-2xl border text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
                          difficulty === diff
                            ? 'bg-slate-800 text-white border-indigo-500 shadow-xs'
                            : 'bg-slate-900/20 border-slate-800 text-slate-450 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Count Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Question Count</label>
                  <div className="grid grid-cols-3 gap-2">
                    {questionCounts.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCount(num)}
                        className={`py-3.5 rounded-2xl border text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
                          count === num
                            ? 'bg-slate-800 text-white border-indigo-500 shadow-xs'
                            : 'bg-slate-900/20 border-slate-800 text-slate-450 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quiz Type Selector */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quiz Mode</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {quizTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setQuizType(type.value)}
                        className={`py-4 px-5 rounded-2xl border text-left transition-all cursor-pointer ${
                          quizType === type.value
                            ? 'bg-indigo-950/20 text-white border-indigo-500 shadow-xs'
                            : 'bg-slate-900/20 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <p className="text-sm font-bold">{type.label}</p>
                        <span className="text-[10px] text-slate-450 font-medium block mt-1">
                          {type.value === 'MCQ' && 'Standard four-choice single answer tests.'}
                          {type.value === 'Short Answer' && 'Written conceptual descriptions graded by AI.'}
                          {type.value === 'Mixed' && 'A dynamic balance of MCQs and written responses.'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/40 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-neon-gradient text-white hover:opacity-95 transition-opacity font-bold text-sm shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <Play className="h-4 w-4" />
                  Generate and Start Quiz
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuizGenerator;

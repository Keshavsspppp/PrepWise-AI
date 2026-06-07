import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, HelpCircle, FileText, Sparkles, SlidersHorizontal } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import QuizCard from '../components/QuizCard';
import API from '../api/axios';

const QuizHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');

  const subjects = ['All', 'DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude', 'Other'];

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get('/quiz/history');
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Failed to retrieve quiz attempts history. Please reload.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRetake = (attempt) => {
    // Navigate back to attempt page using the original quiz ID
    navigate(`/quiz/attempt/${attempt.quiz_id}`);
  };

  // Filter history based on search topic and subject filter
  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.topic.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || item.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <DashboardLayout currentPage="AI Quiz Planner">
      <div className="space-y-6">
        
        {/* Header Action panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Quiz History Dashboard</h2>
            <p className="text-xs text-slate-400">Review your past performance analysis, scores, and re-attempt previous quizzes.</p>
          </div>
          <button
            onClick={() => navigate('/quiz/generator')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-neon-gradient text-white hover:opacity-95 font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Generate New Quiz
          </button>
        </div>

        {/* Search & Filtering Control Card */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-5 flex flex-col md:flex-row gap-4 items-center shadow-xs backdrop-blur-md">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic name..."
              className="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/40 pl-11 pr-4 py-3 text-sm rounded-xl text-white placeholder-slate-550 outline-hidden"
            />
          </div>

          {/* Subject Filter grid */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <SlidersHorizontal className="h-4 w-4 text-slate-500 hidden sm:block" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full md:w-48 bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 text-sm text-slate-350 cursor-pointer focus:border-slate-700 outline-hidden"
            >
              {subjects.map((sub) => (
                <option key={sub} value={sub} className="bg-slate-950 text-white">
                  {sub} Filter
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dashboard History list */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center animate-spin">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-400">Loading attempts details...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/15 border border-red-900/30 text-red-400 rounded-3xl text-sm flex flex-col items-center text-center gap-3">
            <HelpCircle className="h-8 w-8" />
            <span>{error}</span>
            <button
              onClick={fetchHistory}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Retry Load
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/25 border border-slate-800/60 rounded-3xl flex flex-col items-center justify-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-slate-900/65 border border-slate-850 flex items-center justify-center text-slate-550">
              <FileText className="h-6 w-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Quizzes Found</h3>
              <p className="text-xs text-slate-450">
                {search || subjectFilter !== 'All' 
                  ? "No previous attempts match your filters."
                  : "You haven't generated any study quizzes yet."}
              </p>
            </div>
            {!search && subjectFilter === 'All' && (
              <button
                onClick={() => navigate('/quiz/generator')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-555 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Generate First Quiz
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredHistory.map((attempt) => (
              <QuizCard
                key={attempt.result_id}
                attempt={attempt}
                onRetake={handleRetake}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuizHistory;

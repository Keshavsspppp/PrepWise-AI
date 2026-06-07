import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import { Mic, BookOpen, BarChart3, Loader2, AlertCircle, ChevronRight, Clock, History } from 'lucide-react';

const SUBJECTS = ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude', 'Other'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const QUESTION_COUNTS = [5, 10, 15];

const SelectCard = ({ label, options, value, onChange, icon: Icon }) => (
  <div className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon className="h-4 w-4 text-indigo-400" />}
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer
            ${value === opt
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-indigo-500/40 shadow-md shadow-indigo-500/20'
              : 'bg-slate-800/50 text-slate-400 border-slate-700/40 hover:text-white hover:border-slate-600'}`}>
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const MockViva = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('DSA');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.post('/viva/start', {
        subject, difficulty, question_count: questionCount
      });
      // Navigate to the session page with viva data
      navigate('/viva/session', {
        state: {
          vivaId: res.data.viva_id,
          firstQuestion: res.data.first_question,
          totalQuestions: res.data.total_questions,
          subject: res.data.subject,
          difficulty: res.data.difficulty,
        }
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start viva. Please upload notes for this subject first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout currentPage="AI Mock Viva">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/20">
              <Mic className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-text-primary">AI Mock Viva</h1>
              <p className="text-xs text-slate-500 mt-0.5">RAG-powered oral examination from your uploaded notes</p>
            </div>
          </div>
          <button onClick={() => navigate('/viva/history')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700/60 transition-all cursor-pointer">
            <History className="h-3.5 w-3.5" /> History
          </button>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: BookOpen, label: 'RAG Retrieval', desc: 'Questions generated from your uploaded notes' },
            { icon: Mic,      label: 'AI Evaluation', desc: 'Gemini evaluates your answers in real-time' },
            { icon: BarChart3,label: 'Detailed Report', desc: 'Get scores, feedback & improvement tips' },
          ].map((item, i) => (
            <div key={i} className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <item.icon className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-[10px] font-bold text-white mb-1">{item.label}</p>
              <p className="text-[9px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Config */}
        <div className="space-y-4 mb-6">
          <SelectCard label="Select Subject" options={SUBJECTS} value={subject} onChange={setSubject} icon={BookOpen} />
          <SelectCard label="Difficulty Level" options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} icon={BarChart3} />
          <SelectCard label="Number of Questions" options={QUESTION_COUNTS} value={questionCount} onChange={setQuestionCount} icon={Clock} />
        </div>

        {/* Session preview */}
        <div className="bg-slate-900/30 border border-indigo-500/15 rounded-2xl p-4 mb-6">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Session Preview</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-300">
            <span>📚 <strong>{subject}</strong></span>
            <span>⚡ <strong>{difficulty}</strong></span>
            <span>📝 <strong>{questionCount} Questions</strong></span>
            <span>⏱️ Est. <strong>~{questionCount * 3} min</strong></span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-4">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <button id="start-viva-btn" onClick={handleStart} disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 hover:from-cyan-600 hover:via-indigo-600 hover:to-violet-700 text-white font-bold text-base rounded-2xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Generating Questions from Your Notes...</>
          ) : (
            <><Mic className="h-5 w-5" /> Start Mock Viva <ChevronRight className="h-5 w-5" /></>
          )}
        </button>

        <p className="text-[10px] text-slate-600 text-center mt-3">
          Questions are generated exclusively from your uploaded study notes using RAG technology.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default MockViva;

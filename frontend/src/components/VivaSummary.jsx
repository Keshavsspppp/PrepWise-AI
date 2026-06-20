import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import ProgressRing from './ProgressRing';
const GRADE_CONFIG = {
  'Distinction':        { color: '#22c55e', label: 'Distinction 🏆', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
  'Merit':              { color: '#06b6d4', label: 'Merit ⭐',        badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20' },
  'Pass':               { color: '#f59e0b', label: 'Pass 👍',         badge: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
  'Needs Improvement':  { color: '#ef4444', label: 'Needs Improvement', badge: 'bg-red-500/15 text-red-300 border-red-500/20' },
};
const VivaSummary = ({ subject, difficulty, total_score, max_possible, avg_score, percentage, grade, questions_answered, strengths = [], weaknesses = [], missing_concepts = [], answers = [] }) => {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG['Pass'];
  return (
    <div className="space-y-6">
      {/* Score hero */}
      <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-8 backdrop-blur-md text-center">
        <div className="flex justify-center mb-4">
          <ProgressRing score={percentage} size={120} strokeWidth={10} color={cfg.color} sublabel="%" />
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">{total_score} / {max_possible}</h2>
        <span className={`inline-flex text-sm font-bold px-4 py-1.5 rounded-full border ${cfg.badge}`}>{cfg.label}</span>
        <p className="text-xs text-slate-500 mt-3">{subject} · {difficulty} · {questions_answered} Questions</p>
        <p className="text-xs text-slate-600 mt-1">Avg score per question: <span className="text-white font-bold">{avg_score}/10</span></p>
      </div>
      {/* Question-wise scores */}
      {answers.length > 0 && (
        <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-6 backdrop-blur-md">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Question-wise Performance</p>
          <div className="space-y-2">
            {answers.map((a, i) => {
              const sc = a.score || 0;
              const color = sc >= 8 ? '#22c55e' : sc >= 5 ? '#f59e0b' : '#ef4444';
              const barGrad = sc >= 8 ? 'from-emerald-500 to-teal-400' : sc >= 5 ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-rose-400';
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-slate-500 w-4">Q{i + 1}</span>
                  <p className="text-[10px] text-slate-400 w-40 truncate flex-shrink-0">{a.question}</p>
                  <div className="flex-1 h-2 bg-slate-800/60 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${barGrad} rounded-full transition-all duration-700`}
                      style={{ width: `${sc * 10}%` }} />
                  </div>
                  <span className="text-[10px] font-extrabold w-8 text-right" style={{ color }}>{sc}/10</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <div className="bg-emerald-500/6 border border-emerald-500/15 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Strengths</p>
            </div>
            {strengths.map((s, i) => <p key={i} className="text-xs text-emerald-300 font-medium">✓ {s}</p>)}
          </div>
        )}
        {weaknesses.length > 0 && (
          <div className="bg-red-500/6 border border-red-500/15 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Weak Areas</p>
            </div>
            {weaknesses.map((w, i) => <p key={i} className="text-xs text-red-300 font-medium">✗ {w}</p>)}
          </div>
        )}
      </div>
      {/* Missing concepts */}
      {missing_concepts.length > 0 && (
        <div className="bg-amber-500/6 border border-amber-500/15 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Concepts to Review</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing_concepts.map((c, i) => (
              <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default VivaSummary;
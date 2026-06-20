import { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
const FeedbackCard = ({ score, feedback, missing_concepts = [], strengths = [], correctness_summary, reference_answer, question_number }) => {
  const [showRef, setShowRef] = useState(false);
  const scoreColor = score >= 8 ? 'text-emerald-400' : score >= 5 ? 'text-brand-400' : 'text-red-400';
  const scoreBg   = score >= 8 ? 'bg-emerald-500/15 border-emerald-500/20' : score >= 5 ? 'bg-amber-500/15 border-amber-500/20' : 'bg-red-500/15 border-red-500/20';
  const Icon = score >= 8 ? CheckCircle2 : score >= 5 ? AlertCircle : XCircle;
  return (
    <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-5 backdrop-blur-md shadow-xs space-y-4">
      {/* Score header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${scoreBg}`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${scoreColor}`} />
          <span className="text-sm font-bold text-white">Question {question_number} Feedback</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-2xl font-extrabold ${scoreColor}`}>{score}</span>
          <span className="text-slate-500 text-sm font-bold">/10</span>
        </div>
      </div>
      {/* Correctness summary */}
      {correctness_summary && (
        <p className="text-xs text-slate-400 font-medium italic">{correctness_summary}</p>
      )}
      {/* Main feedback */}
      <div className="p-3.5 bg-slate-950/30 rounded-2xl border border-slate-800/40">
        <p className="text-xs text-slate-300 leading-relaxed">{feedback}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
            <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">✓ Strengths</p>
            {strengths.map((s, i) => (
              <p key={i} className="text-[10px] text-emerald-300 font-medium">• {s}</p>
            ))}
          </div>
        )}
        {/* Missing concepts */}
        {missing_concepts.length > 0 && (
          <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-2xl">
            <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1.5">✗ Missing Concepts</p>
            {missing_concepts.map((c, i) => (
              <p key={i} className="text-[10px] text-red-300 font-medium">• {c}</p>
            ))}
          </div>
        )}
      </div>
      {/* Reference answer toggle */}
      {reference_answer && (
        <div>
          <button onClick={() => setShowRef(v => !v)}
            className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
            <BookOpen className="h-3.5 w-3.5" />
            {showRef ? 'Hide' : 'View'} Reference Answer
            {showRef ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showRef && (
            <div className="mt-2 p-3.5 bg-indigo-500/6 border border-indigo-500/20 rounded-2xl">
              <p className="text-xs text-indigo-200 leading-relaxed">{reference_answer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default FeedbackCard;
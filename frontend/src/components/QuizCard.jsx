import { Calendar, Award, ChevronRight, FileText } from 'lucide-react';
const QuizCard = ({ attempt, onRetake, onViewResults }) => {
  const formattedDate = new Date(attempt.completed_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Easy': return 'bg-emerald-550/15 text-emerald-400 border border-emerald-500/25';
      case 'Medium': return 'bg-amber-550/15 text-amber-400 border border-amber-500/25';
      case 'Hard': return 'bg-rose-550/15 text-rose-400 border border-rose-500/25';
      default: return 'bg-slate-550/15 text-slate-400 border border-slate-500/25';
    }
  };
  const getPercentageColor = (pct) => {
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 50) return 'text-amber-400';
    return 'text-red-400';
  };
  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-slate-700/60 transition-all duration-205 shadow-xs group">
      <div className="flex items-start gap-4 cursor-pointer flex-1" onClick={() => onViewResults && onViewResults(attempt)}>
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-slate-905/70 border border-slate-800 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
          <FileText className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold text-cyan-400 bg-cyan-950/20 px-2 py-0.5 rounded-sm tracking-wider uppercase">
              {attempt.subject}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${getDifficultyColor(attempt.difficulty)}`}>
              {attempt.difficulty}
            </span>
          </div>
          <h4 className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
            {attempt.topic}
          </h4>
          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold pt-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-3.5 w-3.5" />
              <span>{attempt.quiz_type}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-800/40 pt-3 sm:pt-0">
        <div className="text-left sm:text-right">
          <span className="text-[9px] font-bold text-slate-550 uppercase tracking-wider block">Score</span>
          <p className="text-lg font-extrabold text-white flex items-baseline sm:justify-end gap-1 mt-0.5">
            <span className={getPercentageColor(attempt.percentage)}>{attempt.score}</span>
            <span className="text-[11px] text-slate-550 font-semibold">/ {attempt.total}</span>
          </p>
        </div>
        <button
          onClick={() => onRetake(attempt)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-805 text-xs font-bold text-white transition-colors cursor-pointer border border-slate-800 hover:border-slate-750"
        >
          Retake Quiz
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
export default QuizCard;
const STATUS_CONFIG = {
  'Ready':            { bar: 'from-emerald-500 to-teal-400', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  'Good':             { bar: 'from-cyan-500 to-indigo-500',  badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
  'Needs Improvement':{ bar: 'from-amber-500 to-yellow-400', badge: 'bg-amber-500/15 text-brand-400 border-amber-500/20' },
  'High Risk':        { bar: 'from-red-500 to-rose-400',     badge: 'bg-red-500/15 text-red-400 border-red-500/20' },
};
const getStatusConfig = s => STATUS_CONFIG[s] || STATUS_CONFIG['Needs Improvement'];
const SubjectReadinessCard = ({ subject, readiness_score = 0, status, quiz_avg, retention_avg, quiz_attempts, rank }) => {
  const cfg = getStatusConfig(status);
  return (
    <div className="bg-slate-900/30 border border-slate-800/70 rounded-2xl p-4 hover:border-slate-700/60 transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {rank && (
            <span className="flex-shrink-0 text-[9px] font-extrabold text-slate-500 bg-slate-800/60 rounded-lg px-1.5 py-0.5 border border-slate-700/40">#{rank}</span>
          )}
          <div>
            <p className="text-sm font-bold text-white">{subject}</p>
            <p className="text-[10px] text-slate-500">{quiz_attempts} quiz attempt{quiz_attempts !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>{status}</span>
      </div>
      {/* Score */}
      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-extrabold text-white">{readiness_score.toFixed(0)}<span className="text-sm text-slate-500 font-medium">%</span></span>
        <div className="text-right text-[9px] text-slate-500">
          <div>Quiz: <span className="text-slate-300 font-bold">{quiz_avg?.toFixed(0) ?? '—'}%</span></div>
          <div>Retention: <span className="text-slate-300 font-bold">{retention_avg?.toFixed(0) ?? '—'}%</span></div>
        </div>
      </div>
      {/* Bar */}
      <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full transition-all duration-700`}
          style={{ width: `${Math.max(readiness_score, 3)}%` }} />
      </div>
    </div>
  );
};
export default SubjectReadinessCard;
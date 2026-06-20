import { AlertTriangle, TrendingDown, CheckCircle2, BookOpen } from 'lucide-react';
const RISK_CONFIG = {
  High:   { icon: AlertTriangle, iconColor: 'text-red-400',    bg: 'bg-red-500/8',    border: 'border-red-500/20',    bar: 'from-red-500 to-rose-400',    badge: 'bg-red-500/15 text-red-400 border-red-500/20',   dot: 'bg-red-400' },
  Medium: { icon: TrendingDown,  iconColor: 'text-brand-400',  bg: 'bg-amber-500/8',  border: 'border-amber-500/20',  bar: 'from-amber-500 to-yellow-400', badge: 'bg-amber-500/15 text-brand-400 border-amber-500/20', dot: 'bg-amber-400' },
  Low:    { icon: CheckCircle2,  iconColor: 'text-emerald-400',bg: 'bg-emerald-500/8',border: 'border-emerald-500/20',bar: 'from-emerald-500 to-teal-400', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
};
const TopicRiskCard = ({ topic, subject, retention_score, risk_level, revision_priority, days_since_studied, num_revisions, next_revision, onRevise, loading }) => {
  const cfg = RISK_CONFIG[risk_level] || RISK_CONFIG.Low;
  const Icon = cfg.icon;
  return (
    <div className={`group rounded-2xl border p-4 transition-all duration-200 hover:shadow-lg ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3">
        {/* Priority badge */}
        <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-xl bg-slate-900/60 border ${cfg.border} text-xs font-extrabold text-white`}>
          #{revision_priority}
        </div>
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-white">{topic}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <BookOpen className="h-3 w-3 text-slate-500" />
                <span className="text-[10px] text-slate-500 font-medium">{subject}</span>
              </div>
            </div>
            <span className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${cfg.badge}`}>
              <Icon className="h-2.5 w-2.5 inline mr-1" />
              {risk_level} Risk
            </span>
          </div>
          {/* Retention bar */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-[10px] font-medium">
              <span className="text-slate-500">Retention</span>
              <span className="text-white font-bold">{retention_score.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-slate-950/40 rounded-full overflow-hidden border border-slate-900/40">
              <div
                className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${Math.max(retention_score, 3)}%` }}
              />
            </div>
          </div>
          {/* Meta row */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[9px] text-slate-500 bg-slate-800/50 border border-slate-700/40 px-2 py-0.5 rounded-full">
              📅 {days_since_studied}d since studied
            </span>
            <span className="text-[9px] text-slate-500 bg-slate-800/50 border border-slate-700/40 px-2 py-0.5 rounded-full">
              🔄 {num_revisions} revision{num_revisions !== 1 ? 's' : ''}
            </span>
            {next_revision && (
              <span className="text-[9px] text-slate-500 bg-slate-800/50 border border-slate-700/40 px-2 py-0.5 rounded-full">
                ⏰ Next: {next_revision}
              </span>
            )}
          </div>
          {/* CTA */}
          {onRevise && (
            <button
              onClick={onRevise}
              disabled={loading}
              className={`mt-3 w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer
                ${risk_level === 'High'
                  ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/25'
                  : risk_level === 'Medium'
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-brand-300 border border-amber-500/25'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Marking...' : '✓ Mark Revision Complete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default TopicRiskCard;
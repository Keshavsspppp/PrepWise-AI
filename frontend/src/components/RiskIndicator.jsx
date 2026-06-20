import { AlertTriangle, TrendingUp, CheckCircle2, Minus } from 'lucide-react';
const CONFIGS = {
  'High Risk':         { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    dot: 'bg-red-400',    barGrad: 'from-red-500 to-rose-400' },
  'Moderate Risk':     { icon: AlertTriangle, color: 'text-brand-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  dot: 'bg-amber-400',  barGrad: 'from-amber-500 to-yellow-400' },
  'Good Preparation':  { icon: TrendingUp,    color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   dot: 'bg-cyan-400',   barGrad: 'from-cyan-500 to-indigo-400' },
  'Exam Ready':        { icon: CheckCircle2,  color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/20',dot: 'bg-emerald-400',barGrad: 'from-emerald-500 to-teal-400' },
  'default':           { icon: Minus,         color: 'text-slate-400',  bg: 'bg-slate-800/30',  border: 'border-slate-700/30',  dot: 'bg-slate-500',  barGrad: 'from-slate-500 to-slate-400' },
};
const RiskIndicator = ({ score = 0, label, status }) => {
  const cfg = CONFIGS[status] || CONFIGS['default'];
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
      <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} style={{ boxShadow: `0 0 6px currentColor` }} />
      <div className="flex-1 min-w-0">
        {label && <p className="text-xs font-bold text-white truncate">{label}</p>}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${cfg.barGrad} rounded-full transition-all duration-700`}
              style={{ width: `${Math.max(score, 3)}%` }} />
          </div>
          <span className="text-[10px] font-extrabold text-white">{score.toFixed(0)}%</span>
        </div>
      </div>
      <Icon className={`h-4 w-4 flex-shrink-0 ${cfg.color}`} />
    </div>
  );
};
export default RiskIndicator;
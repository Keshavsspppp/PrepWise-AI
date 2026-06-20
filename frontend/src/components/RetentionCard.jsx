const RISK_COLORS = {
  High:   { ring: 'var(--color-danger)', glow: 'shadow-red-500/20',   badge: 'bg-red-500/15 text-red-400 border-red-500/25',   label: 'High Risk' },
  Medium: { ring: 'var(--color-warning)', glow: 'shadow-amber-500/20', badge: 'bg-amber-500/15 text-brand-400 border-amber-500/25', label: 'Medium Risk' },
  Low:    { ring: 'var(--color-success)', glow: 'shadow-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', label: 'Low Risk' },
};
const RetentionCard = ({ topic, subject, retention_score, risk_level, next_revision, days_since_studied, compact = false }) => {
  const risk = RISK_COLORS[risk_level] || RISK_COLORS.Low;
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (retention_score / 100) * circ;
  return (
    <div className={`bg-slate-900/40 border border-slate-800/70 rounded-2xl p-4 backdrop-blur-md hover:border-slate-700/60 transition-all duration-200 ${compact ? '' : 'shadow-xs'}`}>
      <div className="flex items-center gap-3">
        {/* Ring gauge */}
        <div className="relative flex-shrink-0 h-20 w-20">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r={radius} stroke="var(--chart-bg-bar)" strokeWidth="7" fill="transparent" />
            <circle
              cx="45" cy="45" r={radius}
              stroke={risk.ring}
              strokeWidth="7"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.6s ease-out', filter: risk.ring.startsWith('var') ? `drop-shadow(0 0 4px ${risk.ring})` : `drop-shadow(0 0 4px ${risk.ring}55)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-extrabold text-white leading-none">{retention_score.toFixed(0)}%</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">Memory</span>
          </div>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{topic}</p>
          <p className="text-[10px] text-slate-500 font-medium truncate mb-2">{subject}</p>
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${risk.badge}`}>
              {risk.label}
            </span>
            {days_since_studied > 0 && (
              <span className="text-[9px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/40">
                {days_since_studied}d ago
              </span>
            )}
          </div>
          {next_revision && (
            <p className="text-[9px] text-slate-600 mt-1.5 font-medium">
              Next revision: <span className="text-slate-400">{next_revision}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
export default RetentionCard;
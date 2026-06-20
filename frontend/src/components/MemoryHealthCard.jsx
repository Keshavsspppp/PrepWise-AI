import { Heart } from 'lucide-react';
const MemoryHealthCard = ({ topics = [] }) => {
  if (!topics.length) {
    return (
      <div className="card card-body backdrop-blur-md flex items-center justify-center min-h-[140px]">
        <p className="text-sm text-secondary font-medium">No topics tracked yet</p>
      </div>
    );
  }
  const avgRetention = topics.reduce((s, t) => s + t.retention_score, 0) / topics.length;
  const highRisk = topics.filter(t => t.risk_level === 'High').length;
  const mediumRisk = topics.filter(t => t.risk_level === 'Medium').length;
  const lowRisk = topics.filter(t => t.risk_level === 'Low').length;
  const totalTopics = topics.length;
  // Health score: penalise high-risk topics heavily
  const healthScore = Math.max(0, Math.round(avgRetention - highRisk * 8 - mediumRisk * 3));
  const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Attention';
  const healthColor = healthScore >= 80 ? 'var(--color-success)' : healthScore >= 60 ? 'var(--color-dbms-from)' : healthScore >= 40 ? 'var(--color-warning)' : 'var(--color-danger)';
  const healthGrad = healthScore >= 80 
    ? 'linear-gradient(to right, var(--color-success), var(--teal))' 
    : healthScore >= 60 
    ? 'linear-gradient(to right, var(--color-dbms-from), var(--color-dsa-from))' 
    : healthScore >= 40 
    ? 'linear-gradient(to right, var(--color-warning), var(--color-os-to))' 
    : 'linear-gradient(to right, var(--color-danger), var(--color-pink))';
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (healthScore / 100) * circ;
  const bar = (count, total, color) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return { pct, color };
  };
  const bars = [
    bar(highRisk, totalTopics, 'var(--color-danger)'),
    bar(mediumRisk, totalTopics, 'var(--color-warning)'),
    bar(lowRisk, totalTopics, 'var(--color-success)'),
  ];
  return (
    <div className="card card-body backdrop-blur-md">
      <div className="flex items-center gap-2 mb-5">
        <Heart className="h-4 w-4 text-rose-400" />
        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Memory Health</h3>
      </div>
      <div className="flex gap-6 items-center">
        {/* Radial health gauge */}
        <div className="flex-shrink-0 relative h-[120px] w-[120px]">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="healthGrad" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={healthColor} />
                <stop offset="100%" stopColor={healthColor} stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={radius} stroke="var(--chart-bg-bar)" strokeWidth="10" fill="transparent" />
            <circle
              cx="60" cy="60" r={radius}
              stroke="url(#healthGrad)"
              strokeWidth="10"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              style={{ filter: `drop-shadow(0 0 6px ${healthColor}55)`, transition: 'stroke-dashoffset 0.8s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-primary">{healthScore}</span>
            <span className="text-[9px] text-muted font-bold uppercase">{healthLabel}</span>
          </div>
        </div>
        {/* Right side stats */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span className="text-secondary">Avg Retention</span>
              <span className="text-primary">{avgRetention.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${avgRetention}%`, background: healthGrad }} />
            </div>
          </div>
          {/* Distribution pills */}
          <div className="flex gap-1.5 h-4 rounded-full overflow-hidden">
            {bars.map((b, i) => b.pct > 0 && (
              <div key={i} className="rounded-full transition-all duration-700" style={{ width: `${b.pct}%`, backgroundColor: b.color, minWidth: '6px' }} />
            ))}
          </div>
          <div className="flex gap-3">
            <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: 'var(--color-danger)' }}>
              <span className="h-2 w-2 rounded-full inline-block" style={{ background: 'var(--color-danger)' }} />{highRisk} High
            </span>
            <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: 'var(--color-warning)' }}>
              <span className="h-2 w-2 rounded-full inline-block" style={{ background: 'var(--color-warning)' }} />{mediumRisk} Med
            </span>
            <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: 'var(--color-success)' }}>
              <span className="h-2 w-2 rounded-full inline-block" style={{ background: 'var(--color-success)' }} />{lowRisk} Low
            </span>
          </div>
          <p className="text-[10px] text-muted font-medium">{totalTopics} topics tracked</p>
        </div>
      </div>
    </div>
  );
};
export default MemoryHealthCard;
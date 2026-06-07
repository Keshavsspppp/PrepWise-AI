import React from 'react';
import { Brain, Heart } from 'lucide-react';

const MemoryHealthCard = ({ topics = [] }) => {
  if (!topics.length) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-6 backdrop-blur-md flex items-center justify-center min-h-[140px]">
        <p className="text-sm text-slate-600 font-medium">No topics tracked yet</p>
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
  const healthColor = healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#06b6d4' : healthScore >= 40 ? '#f59e0b' : '#ef4444';
  const healthGrad  = healthScore >= 80 ? 'from-emerald-500 to-teal-400' : healthScore >= 60 ? 'from-cyan-500 to-indigo-500' : healthScore >= 40 ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-rose-400';

  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (healthScore / 100) * circ;

  const bar = (count, total, color) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return { pct, color };
  };

  const bars = [
    bar(highRisk, totalTopics, '#ef4444'),
    bar(mediumRisk, totalTopics, '#f59e0b'),
    bar(lowRisk, totalTopics, '#22c55e'),
  ];

  return (
    <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-6 backdrop-blur-md shadow-xs">
      <div className="flex items-center gap-2 mb-5">
        <Heart className="h-4 w-4 text-rose-400" />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Memory Health</h3>
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
            <circle cx="60" cy="60" r={radius} stroke="#1e293b" strokeWidth="10" fill="transparent" />
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
            <span className="text-2xl font-extrabold text-white">{healthScore}</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase">{healthLabel}</span>
          </div>
        </div>

        {/* Right side stats */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex justify-between text-[10px] font-bold mb-1">
              <span className="text-slate-400">Avg Retention</span>
              <span className="text-white">{avgRetention.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${healthGrad} rounded-full transition-all duration-700`} style={{ width: `${avgRetention}%` }} />
            </div>
          </div>

          {/* Distribution pills */}
          <div className="flex gap-1.5 h-4 rounded-full overflow-hidden">
            {bars.map((b, i) => b.pct > 0 && (
              <div key={i} className="rounded-full transition-all duration-700" style={{ width: `${b.pct}%`, backgroundColor: b.color, minWidth: '6px' }} />
            ))}
          </div>
          <div className="flex gap-3">
            <span className="flex items-center gap-1 text-[9px] text-red-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />{highRisk} High
            </span>
            <span className="flex items-center gap-1 text-[9px] text-amber-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />{mediumRisk} Med
            </span>
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />{lowRisk} Low
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">{totalTopics} topics tracked</p>
        </div>
      </div>
    </div>
  );
};

export default MemoryHealthCard;

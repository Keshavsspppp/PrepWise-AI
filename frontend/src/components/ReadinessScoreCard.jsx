import React from 'react';
import { Trophy, Target, TrendingUp, AlertTriangle } from 'lucide-react';

const RISK_CONFIG = {
  'Exam Ready':         { color: '#22c55e', grad: 'from-emerald-500 to-teal-400', label: 'Exam Ready',      icon: Trophy,       badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
  'Good Preparation':  { color: '#06b6d4', grad: 'from-cyan-500 to-indigo-500',   label: 'Good Prep',      icon: TrendingUp,   badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20' },
  'Moderate Risk':     { color: '#f59e0b', grad: 'from-amber-500 to-yellow-400',  label: 'Moderate Risk',  icon: Target,       badge: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
  'High Risk':         { color: '#ef4444', grad: 'from-red-500 to-rose-400',      label: 'High Risk',      icon: AlertTriangle,badge: 'bg-red-500/15 text-red-300 border-red-500/20' },
  'Ready':             { color: '#22c55e', grad: 'from-emerald-500 to-teal-400',  label: 'Exam Ready',     icon: Trophy,       badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
  'Good':              { color: '#06b6d4', grad: 'from-cyan-500 to-indigo-500',   label: 'Good Prep',      icon: TrendingUp,   badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20' },
};

const getConfig = (status) => RISK_CONFIG[status] || RISK_CONFIG['Moderate Risk'];

const ReadinessScoreCard = ({ overall_score = 0, prediction_status, exam_prediction, factor_breakdown }) => {
  const cfg = getConfig(prediction_status || exam_prediction);
  const Icon = cfg.icon;
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (overall_score / 100) * circ;

  return (
    <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-6 backdrop-blur-md shadow-xs">
      <div className="flex flex-col items-center text-center mb-6">
        {/* Big ring */}
        <div className="relative h-36 w-36 mb-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 144 144">
            <defs>
              <linearGradient id="rscGrad" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cfg.color} />
                <stop offset="100%" stopColor={cfg.color} stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <circle cx="72" cy="72" r={radius} stroke="#1e293b" strokeWidth="12" fill="transparent" />
            <circle cx="72" cy="72" r={radius} stroke="url(#rscGrad)" strokeWidth="12"
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" fill="transparent"
              style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 8px ${cfg.color}60)` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-white">{Math.round(overall_score)}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">/ 100</span>
          </div>
        </div>

        <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cfg.badge}`}>
          <Icon className="h-3.5 w-3.5" />
          {cfg.label}
        </span>
        <p className="text-[10px] text-slate-500 mt-2 font-medium max-w-[200px]">{exam_prediction}</p>
      </div>

      {/* Factor breakdown */}
      {factor_breakdown && (
        <div className="space-y-2 border-t border-slate-800/50 pt-4">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-3">Score Breakdown</p>
          {Object.entries(factor_breakdown).map(([key, val]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const weight = { quiz_performance: 30, retention_score: 20, study_consistency: 15, revision_completion: 15, subject_coverage: 10, learning_dna: 10 }[key] || 0;
            return (
              <div key={key}>
                <div className="flex justify-between text-[9px] font-medium mb-0.5">
                  <span className="text-slate-400">{label} <span className="text-slate-600">({weight}%)</span></span>
                  <span className="text-white font-bold">{val.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${val}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReadinessScoreCard;

import { Trophy, Target, TrendingUp, AlertTriangle } from 'lucide-react';

const RISK_CONFIG = {
  'Exam Ready': {
    color: 'var(--color-success)',
    label: 'Exam Ready',
    icon: Trophy,
    style: { background: 'var(--color-success-dim)', borderColor: 'var(--color-success-border)', color: 'var(--color-success)' }
  },
  'Good Preparation': {
    color: 'var(--color-accent)',
    label: 'Good Prep',
    icon: TrendingUp,
    style: { background: 'var(--color-accent-dim)', borderColor: 'var(--color-accent-border)', color: 'var(--color-accent)' }
  },
  'Moderate Risk': {
    color: 'var(--color-warning)',
    label: 'Moderate Risk',
    icon: Target,
    style: { background: 'var(--color-warning-dim)', borderColor: 'var(--color-warning-border)', color: 'var(--color-warning)' }
  },
  'High Risk': {
    color: 'var(--color-danger)',
    label: 'High Risk',
    icon: AlertTriangle,
    style: { background: 'var(--color-danger-dim)', borderColor: 'var(--color-danger-border)', color: 'var(--color-danger)' }
  },
  'Ready': {
    color: 'var(--color-success)',
    label: 'Exam Ready',
    icon: Trophy,
    style: { background: 'var(--color-success-dim)', borderColor: 'var(--color-success-border)', color: 'var(--color-success)' }
  },
  'Good': {
    color: 'var(--color-accent)',
    label: 'Good Prep',
    icon: TrendingUp,
    style: { background: 'var(--color-accent-dim)', borderColor: 'var(--color-accent-border)', color: 'var(--color-accent)' }
  },
};

const getConfig = (status) => RISK_CONFIG[status] || RISK_CONFIG['Moderate Risk'];

const ReadinessScoreCard = ({ overall_score = 0, prediction_status, exam_prediction, factor_breakdown }) => {
  const cfg = getConfig(prediction_status || exam_prediction);
  const Icon = cfg.icon;
  const radius = 60;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (overall_score / 100) * circ;
  return (
    <div className="card card-body backdrop-blur-md">
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
            <circle cx="72" cy="72" r={radius} stroke="var(--chart-bg-bar)" strokeWidth="12" fill="transparent" />
            <circle cx="72" cy="72" r={radius} stroke="url(#rscGrad)" strokeWidth="12"
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" fill="transparent"
              style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 8px ${cfg.color}60)` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-primary">{Math.round(overall_score)}</span>
            <span className="text-[10px] text-muted font-bold uppercase tracking-wide">/ 100</span>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border" style={cfg.style}>
          <Icon className="h-3.5 w-3.5" />
          {cfg.label}
        </span>
        <p className="text-[10px] text-muted mt-2 font-medium max-w-[200px]">{exam_prediction}</p>
      </div>
      {/* Factor breakdown */}
      {factor_breakdown && (
        <div className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[9px] text-muted font-bold uppercase tracking-wider mb-3">Score Breakdown</p>
          {Object.entries(factor_breakdown).map(([key, val]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const weight = { quiz_performance: 30, retention_score: 20, study_consistency: 15, revision_completion: 15, subject_coverage: 10, learning_dna: 10 }[key] || 0;
            return (
              <div key={key}>
                <div className="flex justify-between text-[9px] font-medium mb-0.5">
                  <span className="text-secondary">{label} <span className="text-muted">({weight}%)</span></span>
                  <span className="text-primary font-bold">{val.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${val}%`, background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-light))' }} />
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
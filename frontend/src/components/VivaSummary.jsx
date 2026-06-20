import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import ProgressRing from './ProgressRing';

const GRADE_CONFIG = {
  'Distinction': {
    color: 'var(--color-success)',
    label: 'Distinction 🏆',
    style: { background: 'var(--color-success-dim)', borderColor: 'var(--color-success-border)', color: 'var(--color-success)' }
  },
  'Merit': {
    color: 'var(--color-accent)',
    label: 'Merit ⭐',
    style: { background: 'var(--color-accent-dim)', borderColor: 'var(--color-accent-border)', color: 'var(--color-accent)' }
  },
  'Pass': {
    color: 'var(--color-warning)',
    label: 'Pass 👍',
    style: { background: 'var(--color-warning-dim)', borderColor: 'var(--color-warning-border)', color: 'var(--color-warning)' }
  },
  'Needs Improvement': {
    color: 'var(--color-danger)',
    label: 'Needs Improvement',
    style: { background: 'var(--color-danger-dim)', borderColor: 'var(--color-danger-border)', color: 'var(--color-danger)' }
  },
};

const VivaSummary = ({ subject, difficulty, total_score, max_possible, avg_score, percentage, grade, questions_answered, strengths = [], weaknesses = [], missing_concepts = [], answers = [] }) => {
  const cfg = GRADE_CONFIG[grade] || GRADE_CONFIG['Pass'];
  return (
    <div className="space-y-6">
      {/* Score hero */}
      <div className="card card-body backdrop-blur-md text-center">
        <div className="flex justify-center mb-4">
          <ProgressRing score={percentage} size={120} strokeWidth={10} color={cfg.color} sublabel="%" />
        </div>
        <h2 className="text-2xl font-extrabold text-primary mb-2">{total_score} / {max_possible}</h2>
        <span className="inline-flex text-sm font-bold px-4 py-1.5 rounded-full border" style={cfg.style}>{cfg.label}</span>
        <p className="text-xs text-muted mt-3">{subject} · {difficulty} · {questions_answered} Questions</p>
        <p className="text-xs text-muted mt-1">Avg score per question: <span className="text-primary font-bold">{avg_score}/10</span></p>
      </div>

      {/* Question-wise scores */}
      {answers.length > 0 && (
        <div className="card card-body backdrop-blur-md">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-4">Question-wise Performance</p>
          <div className="space-y-2">
            {answers.map((a, i) => {
              const sc = a.score || 0;
              const color = sc >= 8 ? 'var(--color-success)' : sc >= 5 ? 'var(--color-warning)' : 'var(--color-danger)';
              const barGrad = sc >= 8
                ? 'linear-gradient(to right, var(--color-success), var(--color-accent))'
                : sc >= 5
                ? 'linear-gradient(to right, var(--color-warning), var(--color-primary-light))'
                : 'linear-gradient(to right, var(--color-danger), var(--color-pink))';
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-muted w-4">Q{i + 1}</span>
                  <p className="text-[10px] text-secondary w-40 truncate flex-shrink-0">{a.question}</p>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${sc * 10}%`, background: barGrad }} />
                  </div>
                  <span className="text-[10px] font-extrabold w-8 text-right" style={{ color }}>{sc}/10</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--color-success-dim)', border: '1px solid var(--color-success-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-400" style={{ color: 'var(--color-success)' }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-success)' }}>Strengths</p>
            </div>
            {strengths.map((s, i) => <p key={i} className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>✓ {s}</p>)}
          </div>
        )}
        {weaknesses.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--color-danger-dim)', border: '1px solid var(--color-danger-border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4" style={{ color: 'var(--color-danger)' }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-danger)' }}>Weak Areas</p>
            </div>
            {weaknesses.map((w, i) => <p key={i} className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>✗ {w}</p>)}
          </div>
        )}
      </div>

      {/* Missing concepts */}
      {missing_concepts.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-warning-dim)', border: '1px solid var(--color-warning-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" style={{ color: 'var(--color-warning)' }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-warning)' }}>Concepts to Review</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing_concepts.map((c, i) => (
              <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full border" style={{ background: 'var(--color-warning-dim)', borderColor: 'var(--color-warning-border)', color: 'var(--color-warning)' }}>{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VivaSummary;
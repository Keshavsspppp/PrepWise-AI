import { BarChart2 } from 'lucide-react';
const SUBJECT_COLORS = {
  'DSA':                { from: 'var(--color-dsa-from)', to: 'var(--color-dsa-to)' },
  'DBMS':               { from: 'var(--color-dbms-from)', to: 'var(--color-dbms-to)' },
  'Operating Systems':  { from: 'var(--color-os-from)', to: 'var(--color-os-to)' },
  'Computer Networks':  { from: 'var(--color-cn-from)', to: 'var(--color-cn-to)' },
  'Aptitude':           { from: 'var(--color-apt-from)', to: 'var(--color-apt-to)' },
  'Other':              { from: 'var(--color-other-from)', to: 'var(--color-other-to)' },
};
const getColor = (subject) => SUBJECT_COLORS[subject] || SUBJECT_COLORS['Other'];
const RetentionChart = ({ topics = [] }) => {
  if (!topics.length) {
    return (
      <div className="card card-body backdrop-blur-md flex items-center justify-center min-h-[220px]">
        <div className="text-center">
          <BarChart2 className="h-8 w-8 text-secondary mx-auto mb-2" />
          <p className="text-sm text-secondary font-medium">No retention data yet</p>
          <p className="text-xs text-muted mt-1">Take quizzes to populate</p>
        </div>
      </div>
    );
  }
  // Group by subject and compute avg retention per subject
  const subjectMap = {};
  for (const t of topics) {
    if (!subjectMap[t.subject]) subjectMap[t.subject] = { total: 0, count: 0 };
    subjectMap[t.subject].total += t.retention_score;
    subjectMap[t.subject].count += 1;
  }
  const subjectData = Object.entries(subjectMap).map(([subject, d]) => ({
    subject,
    avg: Math.round(d.total / d.count),
  })).sort((a, b) => b.avg - a.avg);
  // Bar chart dimensions
  const chartH = 120;
  const barW = 36;
  const gap = 18;
  const totalW = subjectData.length * (barW + gap) - gap + 20;
  return (
    <div className="card card-body backdrop-blur-md">
      <div className="flex items-center gap-2 mb-5">
        <BarChart2 className="h-4 w-4 text-indigo-400" />
        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Subject Retention Comparison</h3>
      </div>
      {/* SVG Bar Chart */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(totalW, 280)}px` }}>
          <svg viewBox={`0 0 ${Math.max(totalW, 280)} ${chartH + 10}`} style={{ height: `${chartH + 10}px`, width: '100%' }}>
            <defs>
              {subjectData.map((s, i) => {
                const c = getColor(s.subject);
                return (
                  <linearGradient key={i} id={`sbjGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.from} />
                    <stop offset="100%" stopColor={c.to} stopOpacity="0.7" />
                  </linearGradient>
                );
              })}
              {/* Risk zone lines */}
            </defs>
            {/* 75% and 50% horizontal guides */}
            {[75, 50].map((pct, i) => {
              const y = chartH - (pct / 100) * chartH;
              return (
                <g key={i}>
                  <line x1={0} x2={Math.max(totalW, 280)} y1={y} y2={y} stroke={pct === 50 ? 'var(--color-danger)' : 'var(--color-warning)'} strokeOpacity={0.25} strokeDasharray="4 3" strokeWidth="1" />
                  <text x={2} y={y - 3} fill={pct === 50 ? 'var(--color-danger)' : 'var(--color-warning)'} fontSize="7" fontWeight="700">{pct}%</text>
                </g>
              );
            })}
            {/* Bars */}
            {subjectData.map((s, i) => {
              const barH = Math.max((s.avg / 100) * chartH, 4);
              const x = i * (barW + gap) + 10;
              const y = chartH - barH;
              return (
                <g key={i}>
                  {/* BG bar */}
                  <rect x={x} y={0} width={barW} height={chartH} rx={6} fill="var(--chart-bg-bar)" opacity={0.5} />
                  {/* Value bar */}
                  <rect x={x} y={y} width={barW} height={barH} rx={6} fill={`url(#sbjGrad${i})`} opacity={0.9} />
                  {/* Label */}
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="var(--chart-text)" fontSize="8" fontWeight="700">{s.avg}%</text>
                </g>
              );
            })}
          </svg>
          {/* X axis labels */}
          <div className="flex mt-1" style={{ gap: 0 }}>
            {subjectData.map((s, i) => (
              <div key={i} style={{ width: `${barW + gap}px`, flexShrink: 0 }} className="text-center">
                <span className="text-[8px] text-secondary font-medium block leading-tight px-0.5">
                  {s.subject.length > 10 ? s.subject.slice(0, 10) + '…' : s.subject}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Topic-level retention list */}
      {topics.length > 0 && (
        <div className="mt-4 pt-4 border-t border shadow-xs space-y-2" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-3">Topic Breakdown</p>
          {topics.slice(0, 6).map((t, i) => {
            const c = getColor(t.subject);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] text-secondary w-28 truncate flex-shrink-0">{t.topic}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(t.retention_score, 2)}%`,
                      background: `linear-gradient(to right, ${c.from}, ${c.to})`
                    }}
                  />
                </div>
                <span className="text-[9px] font-bold text-primary w-8 text-right">{t.retention_score.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default RetentionChart;
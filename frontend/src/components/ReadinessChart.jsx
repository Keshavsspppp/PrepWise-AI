import { BarChart2 } from 'lucide-react';
const SUBJECT_PALETTES = {
  'DSA': ['var(--color-dsa-from)','var(--color-dsa-to)'], 'DBMS': ['var(--color-dbms-from)','var(--color-dbms-to)'],
  'Operating Systems': ['var(--color-os-from)','var(--color-os-to)'], 'Computer Networks': ['var(--color-cn-from)','var(--color-cn-to)'],
  'Aptitude': ['var(--color-apt-from)','var(--color-apt-to)'], 'Other': ['var(--color-other-from)','var(--color-other-to)'],
};
const getColors = s => SUBJECT_PALETTES[s] || SUBJECT_PALETTES['Other'];
const ReadinessChart = ({ subjects = [], topics = [] }) => {
  const chartH = 130;
  const barW   = 40;
  const gap    = 16;
  const totalW = subjects.length * (barW + gap) + 20;
  return (
    <div className="card card-body backdrop-blur-md space-y-6">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-indigo-400" />
        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Readiness Analysis</h3>
      </div>
      {/* Subject bar chart */}
      {subjects.length > 0 && (
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${Math.max(totalW, 280)}px` }}>
            <svg viewBox={`0 0 ${Math.max(totalW, 280)} ${chartH + 10}`} style={{ height: `${chartH + 10}px`, width: '100%' }}>
              <defs>
                {subjects.map((s, i) => {
                  const [c1, c2] = getColors(s.subject);
                  return (
                    <linearGradient key={i} id={`rcGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c1} /><stop offset="100%" stopColor={c2} stopOpacity="0.7" />
                    </linearGradient>
                  );
                })}
              </defs>
              {/* Guide lines */}
              {[80, 60, 40].map((pct, i) => {
                const y = chartH - (pct / 100) * chartH;
                const strokeColors = ['var(--color-success)', 'var(--color-dsa-from)', 'var(--color-danger)'];
                return (
                  <g key={i}>
                    <line x1={0} x2={Math.max(totalW, 280)} y1={y} y2={y} stroke={strokeColors[i]} strokeOpacity={0.25} strokeDasharray="4 3" strokeWidth="1" />
                    <text x={2} y={y - 3} fill={strokeColors[i]} fontSize="7" fontWeight="700">{pct}%</text>
                  </g>
                );
              })}
              {subjects.map((s, i) => {
                const bH = Math.max((s.readiness_score / 100) * chartH, 4);
                const x  = i * (barW + gap) + 10;
                const y  = chartH - bH;
                return (
                  <g key={i}>
                    <rect x={x} y={0} width={barW} height={chartH} rx={6} fill="var(--chart-bg-bar)" opacity={0.5} />
                    <rect x={x} y={y} width={barW} height={bH} rx={6} fill={`url(#rcGrad${i})`} opacity={0.9} />
                    <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="var(--chart-text)" fontSize="8" fontWeight="700">{s.readiness_score.toFixed(0)}%</text>
                  </g>
                );
              })}
            </svg>
            <div className="flex mt-1">
              {subjects.map((s, i) => (
                <div key={i} style={{ width: `${barW + gap}px`, flexShrink: 0 }} className="text-center">
                  <span className="text-[8px] text-secondary font-medium">{s.subject.length > 8 ? s.subject.slice(0, 8) + '…' : s.subject}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Topic list */}
      {topics.length > 0 && (
        <div className="space-y-1.5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-2">Weak Topics (Top 6)</p>
          {topics.slice(0, 6).map((t, i) => {
            const [c1] = getColors(t.subject);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] text-secondary w-28 truncate flex-shrink-0">{t.topic}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(t.readiness_score, 2)}%`, background: `linear-gradient(to right, ${c1}, ${c1}99)` }} />
                </div>
                <span className="text-[9px] font-bold text-primary w-8 text-right">{t.readiness_score.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ReadinessChart;
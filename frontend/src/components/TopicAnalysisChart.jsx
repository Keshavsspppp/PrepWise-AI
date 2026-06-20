import { TrendingUp } from 'lucide-react';
const TopicAnalysisChart = ({ topics = [] }) => {
  const maxScore = 100;
  const getBarColor = (score) => {
    if (score >= 75) return 'emerald';
    if (score >= 50) return 'amber';
    return 'rose';
  };
  const getLabel = (score) => {
    if (score >= 75) return { text: 'Strong', color: 'var(--color-success)' };
    if (score >= 50) return { text: 'Moderate', color: 'var(--color-warning)' };
    return { text: 'Weak', color: 'var(--color-danger)' };
  };
  if (!topics || topics.length === 0) {
    return (
      <div className="card card-body backdrop-blur-md flex flex-col items-center justify-center min-h-[200px]">
        <TrendingUp className="h-8 w-8 text-secondary mb-3" />
        <p className="text-sm text-secondary font-medium">No topic data yet</p>
        <p className="text-xs text-muted mt-1">Take quizzes to see topic analysis</p>
      </div>
    );
  }
  return (
    <div className="card card-body backdrop-blur-md">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-4.5 w-4.5 text-violet-400" />
        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Topic-Level Analysis</h3>
      </div>
      {/* SVG Bar Chart */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[320px]">
          <svg viewBox={`0 0 ${Math.max(topics.length * 60, 320)} 160`} className="w-full" style={{ height: '160px' }}>
            <defs>
              {topics.map((t, i) => (
                <linearGradient key={i} id={`topicGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  {getBarColor(t.average_score) === 'emerald' ? (
                    <>
                      <stop offset="0%" stopColor="var(--color-success)" />
                      <stop offset="100%" stopColor="var(--color-dbms-from)" />
                    </>
                  ) : getBarColor(t.average_score) === 'amber' ? (
                    <>
                      <stop offset="0%" stopColor="var(--color-warning)" />
                      <stop offset="100%" stopColor="var(--color-os-to)" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="var(--color-danger)" />
                      <stop offset="100%" stopColor="var(--color-pink)" />
                    </>
                  )}
                </linearGradient>
              ))}
            </defs>
            {topics.map((topic, idx) => {
              const barHeight = Math.max((topic.average_score / maxScore) * 120, 6);
              const x = idx * 60 + 15;
              return (
                <g key={idx}>
                  {/* Background bar */}
                  <rect x={x} y={20} width={30} height={120} rx={6} fill="var(--chart-bg-bar)" opacity={0.5} />
                  {/* Value bar */}
                  <rect
                    x={x}
                    y={140 - barHeight}
                    width={30}
                    height={barHeight}
                    rx={6}
                    fill={`url(#topicGrad${idx})`}
                    opacity={0.9}
                  />
                  {/* Score label */}
                  <text x={x + 15} y={145 - barHeight - 4} textAnchor="middle" fill="var(--chart-text)" fontSize="9" fontWeight="700">
                    {topic.average_score}%
                  </text>
                </g>
              );
            })}
          </svg>
          {/* X-axis labels */}
          <div className="flex mt-1" style={{ gap: 0 }}>
            {topics.map((topic, idx) => (
              <div key={idx} style={{ width: '60px', flexShrink: 0 }} className="flex flex-col items-center px-1">
                <span className="text-[9px] text-secondary text-center leading-tight font-medium truncate w-full text-center">
                  {topic.topic.length > 8 ? topic.topic.slice(0, 8) + '…' : topic.topic}
                </span>
                <span className="text-[8px] font-bold mt-0.5" style={{ color: getLabel(topic.average_score).color }}>
                  {getLabel(topic.average_score).text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-full" style={{ background: 'linear-gradient(to right, var(--color-success), var(--color-dbms-from))' }} />
          <span className="text-[10px] text-secondary font-medium">Strong (≥75%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-full" style={{ background: 'linear-gradient(to right, var(--color-warning), var(--color-os-to))' }} />
          <span className="text-[10px] text-secondary font-medium">Moderate (≥50%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-full" style={{ background: 'linear-gradient(to right, var(--color-danger), var(--color-pink))' }} />
          <span className="text-[10px] text-secondary font-medium">Weak (&lt;50%)</span>
        </div>
      </div>
    </div>
  );
};
export default TopicAnalysisChart;
import { Calendar, Clock, CalendarDays, CheckCircle2 } from 'lucide-react';
const BUCKET_CONFIG = {
  today:     { icon: Clock,        label: 'Today',     color: 'text-red-400',    bg: 'bg-red-500/8',    border: 'border-red-500/20' },
  tomorrow:  { icon: Calendar,     label: 'Tomorrow',  color: 'text-brand-400',  bg: 'bg-amber-500/8',  border: 'border-amber-500/20' },
  this_week: { icon: CalendarDays, label: 'This Week', color: 'text-indigo-400', bg: 'bg-indigo-500/8', border: 'border-indigo-500/20' },
};
const TimelineItem = ({ topic, subject, retention_score, risk_level, next_revision, onRevise, markingId, topicId }) => {
  const isLoading = markingId === topicId;
  const riskColor = risk_level === 'High' ? 'text-red-400' : risk_level === 'Medium' ? 'text-brand-400' : 'text-emerald-400';
  const dotColor  = risk_level === 'High' ? 'bg-red-400'  : risk_level === 'Medium' ? 'bg-amber-400'  : 'bg-emerald-400';
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/40 last:border-0 group">
      {/* Timeline dot */}
      <div className={`flex-shrink-0 h-2.5 w-2.5 rounded-full mt-1.5 ${dotColor} shadow-sm`} style={{ boxShadow: `0 0 6px currentColor` }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-white">{topic}</p>
            <p className="text-[10px] text-slate-500">{subject}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[9px] font-bold ${riskColor}`}>{retention_score.toFixed(0)}%</span>
            {next_revision && (
              <span className="text-[9px] text-slate-600 hidden sm:block">{next_revision}</span>
            )}
            <button
              onClick={() => onRevise(topicId)}
              disabled={isLoading}
              title="Mark revision complete"
              className="flex items-center justify-center h-6 w-6 rounded-lg bg-slate-800/70 hover:bg-emerald-500/20 border border-slate-700/50 hover:border-emerald-500/30 text-slate-500 hover:text-emerald-400 transition-all duration-150 cursor-pointer disabled:opacity-40"
              aria-label="Mark revision complete"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const RevisionTimeline = ({ upcoming = [], onRevise, markingId }) => {
  // Group by bucket
  const groups = { today: [], tomorrow: [], this_week: [] };
  for (const item of upcoming) {
    if (groups[item.bucket] !== undefined) {
      groups[item.bucket].push(item);
    }
  }
  const hasAny = Object.values(groups).some(g => g.length > 0);
  return (
    <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-6 backdrop-blur-md shadow-xs">
      <div className="flex items-center gap-2 mb-5">
        <CalendarDays className="h-4 w-4 text-indigo-400" />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revision Schedule</h3>
      </div>
      {!hasAny ? (
        <div className="py-8 flex flex-col items-center text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
          <p className="text-sm text-slate-400 font-semibold">All caught up!</p>
          <p className="text-xs text-slate-600 mt-1">No revisions scheduled in the next 7 days.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([bucket, items]) => {
            if (!items.length) return null;
            const cfg = BUCKET_CONFIG[bucket];
            const Icon = cfg.icon;
            return (
              <div key={bucket}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${cfg.bg} border ${cfg.border} mb-3 w-fit`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                  <span className={`text-[10px] font-bold ${cfg.color} bg-current/10 rounded-full px-1.5`}>{items.length}</span>
                </div>
                <div>
                  {items.map((item, i) => (
                    <TimelineItem
                      key={i}
                      {...item}
                      topicId={item.topic_id}
                      onRevise={onRevise}
                      markingId={markingId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default RevisionTimeline;
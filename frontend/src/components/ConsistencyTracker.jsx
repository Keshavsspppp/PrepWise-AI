import { Flame, Calendar, CheckCircle2 } from 'lucide-react';
// Generate last N days as date strings for tracking
const getLastNDays = (n) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
};
const ConsistencyTracker = ({ streak = 0, consistency_score = 0, active_days_list = [] }) => {
  const last28Days = getLastNDays(28);
  const activeDaySet = new Set(active_days_list);
  // Day labels: Mon, Tue, Wed, Thu, Fri, Sat, Sun headers
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  // Streak fire color logic
  const streakColor = streak >= 7 ? 'text-amber-400' : streak >= 3 ? 'text-orange-400' : 'text-slate-500';
  const streakBg = streak >= 7 ? 'bg-amber-500/10 border-amber-500/20' : streak >= 3 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-slate-800/30 border-slate-700/30';
  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 shadow-xs backdrop-blur-md">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consistency Tracker</h3>
        </div>
        {/* Streak Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${streakBg}`}>
          <Flame className={`h-4 w-4 ${streakColor} ${streak >= 3 ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-extrabold ${streakColor}`}>{streak} day streak</span>
        </div>
      </div>
      {/* Consistency Heatmap Grid — last 28 days */}
      <div className="mb-5">
        <div className="flex gap-1.5 justify-between mb-2">
          {dayLabels.map((d, i) => (
            <span key={i} className="text-[9px] text-slate-600 font-bold uppercase w-full text-center">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {last28Days.map((date, idx) => {
            const isActive = activeDaySet.has(date);
            const isToday = date === new Date().toISOString().split('T')[0];
            return (
              <div
                key={idx}
                title={date}
                className={`
                  h-7 rounded-md transition-all duration-200 cursor-default
                  ${isActive
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-800/40 border border-slate-800/60'
                  }
                  ${isToday ? 'ring-2 ring-cyan-400/60 ring-offset-1 ring-offset-transparent' : ''}
                `}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] text-slate-600 font-medium">28 days</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-slate-800/60 border border-slate-700/40" />
              <span className="text-[9px] text-slate-600 font-medium">Missed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-br from-indigo-500 to-violet-500" />
              <span className="text-[9px] text-slate-600 font-medium">Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-sm ring-2 ring-cyan-400/60 bg-slate-800/60" />
              <span className="text-[9px] text-slate-600 font-medium">Today</span>
            </div>
          </div>
        </div>
      </div>
      {/* Consistency Score Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-slate-400">Consistency Score</span>
          <span className="text-sm font-extrabold text-white">{consistency_score}%</span>
        </div>
        <div className="h-2.5 w-full bg-slate-950/40 rounded-full overflow-hidden border border-slate-900/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
            style={{ width: `${consistency_score || 0}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-medium text-slate-600">
          <span>Irregular</span>
          <span>Consistent Learner</span>
        </div>
      </div>
      {/* Status Pills */}
      <div className="flex gap-2 mt-4 flex-wrap">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold
          ${consistency_score >= 70 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/40 border-slate-700/30 text-slate-500'}`}>
          <CheckCircle2 className="h-3 w-3" />
          {consistency_score >= 70 ? 'On Track' : 'Keep Going'}
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold
          ${streak >= 7 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-800/40 border-slate-700/30 text-slate-500'}`}>
          <Flame className="h-3 w-3" />
          {streak >= 7 ? 'On Fire! 🔥' : streak >= 3 ? 'Building Habit' : 'Start Streak'}
        </div>
      </div>
    </div>
  );
};
export default ConsistencyTracker;
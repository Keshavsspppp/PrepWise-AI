import { Activity, Clock, BookOpen, MessageCircle, FileText } from 'lucide-react';
const StatRow = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-800/40 last:border-0">
    <div className="flex items-center gap-2.5">
      <div className={`flex items-center justify-center h-7 w-7 rounded-lg bg-slate-900/50 border border-slate-800/60`}>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </div>
      <span className="text-xs text-slate-400 font-medium">{label}</span>
    </div>
    <span className="text-sm font-bold text-white">{value}</span>
  </div>
);
const ProgressInsights = ({ activity = {} }) => {
  const {
    total_sessions = 0,
    total_study_hours = 0,
    notes_uploaded = 0,
    questions_asked = 0,
    active_days = 0,
  } = activity;
  // Calculate a "progress score" for the radial gauge
  const progressScore = Math.min(
    Math.round(
      (Math.min(total_sessions, 30) / 30) * 40 +
      (Math.min(total_study_hours, 50) / 50) * 30 +
      (Math.min(active_days, 30) / 30) * 30
    ),
    100
  );
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (progressScore / 100) * circumference;
  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 shadow-xs backdrop-blur-md">
      <div className="flex items-center gap-2 mb-5">
        <Activity className="h-4.5 w-4.5 text-cyan-400" />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Study Activity Insights</h3>
      </div>
      {/* Mini radial progress + stats split layout */}
      <div className="flex gap-4 items-start">
        {/* Mini Radial */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative h-24 w-24">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} stroke="#1e293b" strokeWidth="8" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="url(#progressGrad)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
              <defs>
                <linearGradient id="progressGrad" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-white">{progressScore}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Activity</span>
            </div>
          </div>
          <span className="text-[9px] text-slate-500 font-medium text-center mt-1.5 max-w-[80px]">
            Study progress index
          </span>
        </div>
        {/* Stat Rows */}
        <div className="flex-1 min-w-0">
          <StatRow
            icon={Clock}
            label="Study Sessions"
            value={total_sessions}
            color="text-indigo-400"
          />
          <StatRow
            icon={Activity}
            label="Study Hours"
            value={`${total_study_hours.toFixed(1)}h`}
            color="text-cyan-400"
          />
          <StatRow
            icon={FileText}
            label="Notes Uploaded"
            value={notes_uploaded}
            color="text-violet-400"
          />
          <StatRow
            icon={MessageCircle}
            label="AI Questions"
            value={questions_asked}
            color="text-amber-400"
          />
          <StatRow
            icon={BookOpen}
            label="Active Study Days"
            value={`${active_days} days`}
            color="text-emerald-400"
          />
        </div>
      </div>
    </div>
  );
};
export default ProgressInsights;
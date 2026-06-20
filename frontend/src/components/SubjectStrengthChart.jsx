import { BookOpen } from 'lucide-react';
const SubjectStrengthChart = ({ performances }) => {
  const getSubjectColor = (sub) => {
    switch (sub) {
      case 'DSA': return 'from-rose-500 to-indigo-500';
      case 'DBMS': return 'from-cyan-500 to-indigo-500';
      case 'Operating Systems': return 'from-amber-500 to-orange-500';
      case 'Computer Networks': return 'from-emerald-500 to-teal-500';
      case 'Aptitude': return 'from-indigo-500 to-violet-500';
      default: return 'from-slate-500 to-slate-700';
    }
  };
  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 shadow-xs backdrop-blur-md space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4.5 w-4.5 text-primary" />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject-wise Mastery</h3>
      </div>
      <div className="space-y-5">
        {performances.map((perf, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>{perf.subject}</span>
              <span className="text-white">
                {perf.average_score}% 
                <span className="text-[10px] text-slate-550 font-medium ml-1.5 lowercase">
                  ({perf.attempts} attempts)
                </span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-950/40 rounded-full overflow-hidden border border-slate-900/40 shadow-inner">
              <div 
                className={`h-full bg-gradient-to-r ${getSubjectColor(perf.subject)} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${perf.average_score || 5}%` }} // Min width of 5% for visual indicator
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SubjectStrengthChart;
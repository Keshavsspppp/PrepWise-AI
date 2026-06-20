import { Zap, Target, Flame, GraduationCap } from 'lucide-react';
const DNAOverviewCard = ({ speed, consistency, streak, discipline }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Learning Speed */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Learning Speed</span>
          <Zap className="h-4 w-4 text-cyan-400" />
        </div>
        <div className="mt-4">
          <p className="text-2xl font-extrabold text-white tracking-tight">{speed}</p>
          <span className="text-[9px] text-slate-550 block mt-1.5 font-bold uppercase tracking-wide">Based on mastery</span>
        </div>
      </div>
      {/* Consistency */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Consistency Rate</span>
          <Target className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="mt-4">
          <p className="text-2xl font-extrabold text-white tracking-tight">{consistency}%</p>
          <span className="text-[9px] text-slate-550 block mt-1.5 font-bold uppercase tracking-wide">Study frequency</span>
        </div>
      </div>
      {/* Study Streak */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Daily Streak</span>
          <Flame className="h-4 w-4 text-brand-500 animate-pulse" />
        </div>
        <div className="mt-4">
          <p className="text-2xl font-extrabold text-white tracking-tight">{streak} Days</p>
          <span className="text-[9px] text-slate-550 block mt-1.5 font-bold uppercase tracking-wide">Consecutive study</span>
        </div>
      </div>
      {/* Discipline Score */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs backdrop-blur-md">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Discipline Index</span>
          <GraduationCap className="h-4 w-4 text-violet-400" />
        </div>
        <div className="mt-4">
          <p className="text-2xl font-extrabold text-white tracking-tight">{discipline}%</p>
          <span className="text-[9px] text-slate-550 block mt-1.5 font-bold uppercase tracking-wide">Action metrics</span>
        </div>
      </div>
    </div>
  );
};
export default DNAOverviewCard;
const LearningScoreCard = ({ score }) => {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xs backdrop-blur-md h-full">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">Overall Learning Index</span>
      <div className="relative flex items-center justify-center h-40 w-40">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} className="text-slate-800/50" strokeWidth="10" stroke="currentColor" fill="transparent" />
          <circle 
            cx="80" 
            cy="80" 
            r={radius} 
            className="text-cyan-400" 
            strokeWidth="10" 
            stroke="url(#dnaGradient)" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
            fill="transparent" 
          />
          <defs>
            <linearGradient id="dnaGradient" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-extrabold text-white tracking-tight">{score}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">DNA Score</span>
        </div>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed mt-4 max-w-[220px]">
        A weighted average mapping consistency, retention, and study discipline.
      </p>
    </div>
  );
};
export default LearningScoreCard;
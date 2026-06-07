import React from 'react';

const ProgressBar = ({ current, total }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>Quiz Progress</span>
        <span className="text-cyan-400">{current} of {total} Questions</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
        <div 
          className="h-full bg-neon-gradient transition-all duration-300 ease-out rounded-full" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

import React from 'react';
import { CheckCircle2, XCircle, Award } from 'lucide-react';

const ScoreCard = ({ score, total, percentage }) => {
  const wrong = total - score;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Circle percentage */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-sm backdrop-blur-md">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accuracy Score</span>
        <div className="relative flex items-center justify-center h-32 w-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle 
              cx="64" 
              cy="64" 
              r={radius} 
              className="text-slate-800/60" 
              strokeWidth="8" 
              stroke="currentColor" 
              fill="transparent" 
            />
            <circle 
              cx="64" 
              cy="64" 
              r={radius} 
              className="text-cyan-400" 
              strokeWidth="8" 
              stroke="url(#scoreNeonGradient)" 
              strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" 
              fill="transparent" 
            />
            <defs>
              <linearGradient id="scoreNeonGradient" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold text-white tracking-tight">{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Numerical score details */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Raw Score</span>
          <p className="text-4xl font-extrabold text-white flex items-baseline gap-1.5 pt-2 tracking-tight">
            <span>{score}</span>
            <span className="text-lg text-slate-500 font-semibold">/ {total}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-450 mt-6 pt-4 border-t border-slate-800/40 uppercase tracking-wider">
          <Award className="h-4 w-4 text-amber-500 animate-pulse" />
          <span>Performance Rank</span>
        </div>
      </div>

      {/* Correct vs wrong breakout */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm backdrop-blur-md">
        <div className="space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Breakdown</span>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-950/15 border border-emerald-900/35 rounded-2xl p-4 flex flex-col shadow-inner">
              <div className="flex items-center gap-1.5 text-emerald-450">
                <CheckCircle2 className="h-4.5 w-4.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Correct</span>
              </div>
              <span className="text-2xl font-bold text-emerald-400 mt-2">{score}</span>
            </div>
            <div className="bg-red-950/15 border border-red-900/35 rounded-2xl p-4 flex flex-col shadow-inner">
              <div className="flex items-center gap-1.5 text-red-450">
                <XCircle className="h-4.5 w-4.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Wrong</span>
              </div>
              <span className="text-2xl font-bold text-red-400 mt-2">{wrong}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;

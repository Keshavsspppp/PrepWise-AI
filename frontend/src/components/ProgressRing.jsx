import React from 'react';

// Reusable animated progress ring
const ProgressRing = ({ score = 0, size = 80, strokeWidth = 8, color = '#6366f1', label, sublabel, animate = true }) => {
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const center = size / 2;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={`prGrad_${label}`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <circle cx={center} cy={center} r={radius} stroke="#1e293b" strokeWidth={strokeWidth} fill="transparent" />
          <circle cx={center} cy={center} r={radius} stroke={`url(#prGrad_${label})`} strokeWidth={strokeWidth}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" fill="transparent"
            style={{ transition: animate ? 'stroke-dashoffset 0.9s ease-out' : 'none', filter: `drop-shadow(0 0 4px ${color}55)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-extrabold text-white" style={{ fontSize: size * 0.22 }}>{Math.round(score)}</span>
          {sublabel && <span className="text-slate-500 font-bold uppercase" style={{ fontSize: size * 0.09 }}>{sublabel}</span>}
        </div>
      </div>
      {label && <p className="text-[10px] text-slate-400 font-medium text-center mt-1.5 max-w-[80px]">{label}</p>}
    </div>
  );
};

export default ProgressRing;

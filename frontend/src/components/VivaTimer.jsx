import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
const VivaTimer = ({ paused = false }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [paused]);
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');
  const isLong = elapsed > 600; // > 10 min
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-colors ${
      isLong ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-800/50 border-slate-700/40 text-slate-400'}`}>
      <Clock className="h-3.5 w-3.5" />
      <span className="text-xs font-mono font-bold">{mins}:{secs}</span>
    </div>
  );
};
export default VivaTimer;
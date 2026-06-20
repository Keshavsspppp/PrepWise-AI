import { FileText } from 'lucide-react';
const SourceCard = ({ filename, subject }) => {
  // Map subject to custom colored badge
  const getSubjectBadgeStyle = (sub) => {
    switch (sub) {
      case 'DSA': return 'bg-rose-550/20 text-rose-400 border border-rose-500/30';
      case 'DBMS': return 'bg-cyan-550/20 text-cyan-400 border border-cyan-500/30';
      case 'Operating Systems': return 'bg-amber-550/20 text-brand-400 border border-amber-500/30';
      case 'Computer Networks': return 'bg-emerald-550/20 text-emerald-400 border border-emerald-500/30';
      case 'Aptitude': return 'bg-indigo-550/20 text-indigo-400 border border-indigo-500/30';
      default: return 'bg-slate-550/20 text-slate-400 border border-slate-500/30';
    }
  };
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-750 hover:border-slate-700 transition-all duration-200 shadow-xs max-w-xs truncate group cursor-default">
      <FileText className="h-4 w-4 text-cyan-400 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-slate-200 truncate" title={filename}>
          {filename}
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-sm mt-1 w-max font-bold tracking-wide uppercase ${getSubjectBadgeStyle(subject)}`}>
          {subject}
        </span>
      </div>
    </div>
  );
};
export default SourceCard;
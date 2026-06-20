import { HelpCircle, Lightbulb, Code, BookOpen, Cpu } from 'lucide-react';
const TYPE_CONFIG = {
  Definition:   { icon: BookOpen,  color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20' },
  Conceptual:   { icon: Lightbulb, color: 'text-brand-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
  Scenario:     { icon: Cpu,       color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' },
  Application:  { icon: Code,      color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
};
const getType = t => TYPE_CONFIG[t] || { icon: HelpCircle, color: 'text-slate-400', bg: 'bg-slate-800/30', border: 'border-slate-700' };
const VivaQuestionCard = ({ question, question_type, question_number, total_questions, subject, difficulty }) => {
  const cfg = getType(question_type);
  const Icon = cfg.icon;
  const pct = total_questions > 0 ? Math.round((question_number / total_questions) * 100) : 0;
  return (
    <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-6 backdrop-blur-md shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full border ${cfg.border} ${cfg.bg} ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {question_type}
          </span>
          <span className="text-[9px] text-slate-600 font-medium bg-slate-800/50 border border-slate-700/40 px-2 py-0.5 rounded-full">{difficulty}</span>
        </div>
        <span className="text-xs font-bold text-slate-400">Q{question_number}<span className="text-slate-600"> / {total_questions}</span></span>
      </div>
      {/* Progress */}
      <div className="h-1.5 w-full bg-slate-800/60 rounded-full overflow-hidden mb-5">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }} />
      </div>
      {/* Question */}
      <div className={`p-5 rounded-2xl border ${cfg.border} ${cfg.bg}`}>
        <div className="flex gap-3 items-start">
          <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-xl bg-slate-900/60 border ${cfg.border}`}>
            <Icon className={`h-4 w-4 ${cfg.color}`} />
          </div>
          <p className="text-base font-semibold text-white leading-relaxed">{question}</p>
        </div>
      </div>
      {/* Meta */}
      <p className="text-[10px] text-slate-600 mt-3 text-center">
        Subject: <span className="text-slate-400">{subject}</span> · Question {question_number} of {total_questions}
      </p>
    </div>
  );
};
export default VivaQuestionCard;
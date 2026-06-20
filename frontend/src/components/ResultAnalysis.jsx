import { Sparkles, ThumbsUp, AlertTriangle } from 'lucide-react';
const ResultAnalysis = ({ feedback, score, total }) => {
  const percentage = total > 0 ? (score / total) * 100 : 0;
  const getRevisionTip = () => {
    if (percentage >= 80) {
      return {
        title: "Study Recommendation: Advanced Recall",
        content: "Outstanding performance! You have a solid grasp of these concepts. Challenge yourself with a Hard difficulty quiz or use the AI Study Assistant chat to explore deeper Edge Cases.",
        style: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400",
        icon: ThumbsUp
      };
    } else if (percentage >= 50) {
      return {
        title: "Study Recommendation: Targeted Review",
        content: "Decent understanding, but some knowledge gaps exist. Review the explanations in the incorrect answers section below, review the corresponding chapters in your uploaded PDF notes, and retake the quiz.",
        style: "border-amber-500/20 bg-amber-500/5 text-amber-400",
        icon: Sparkles
      };
    } else {
      return {
        title: "Study Recommendation: Rebuild Foundations",
        content: "Your score indicates core misconceptions. We recommend opening the AI Study Assistant chat and asking it to explain the concepts in simple terms or summarize key highlights from your study materials before re-attempting.",
        style: "border-red-500/20 bg-red-500/5 text-red-400",
        icon: AlertTriangle
      };
    }
  };
  const tip = getRevisionTip();
  const Icon = tip.icon;
  return (
    <div className="space-y-6">
      {/* AI Evaluation */}
      <div className="bg-slate-900/35 border border-slate-800/85 rounded-3xl p-6 shadow-sm backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-600/5 rounded-full blur-2xl"></div>
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-neon-gradient text-white flex-shrink-0 shadow-xs">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">AI Tutor Evaluation</span>
            <p className="text-sm text-slate-200 leading-relaxed font-medium mt-1">
              {feedback}
            </p>
          </div>
        </div>
      </div>
      {/* Suggested Revision Strategy */}
      <div className={`border rounded-3xl p-6 shadow-sm backdrop-blur-md transition-all ${tip.style}`}>
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-900/80 border border-slate-850 flex-shrink-0">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="text-xs font-bold uppercase tracking-wider block text-slate-400">
              {tip.title}
            </span>
            <p className="text-sm leading-relaxed mt-2 text-slate-300">
              {tip.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ResultAnalysis;
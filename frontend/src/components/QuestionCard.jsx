import OptionButton from './OptionButton';
const QuestionCard = ({ question, index, total, selectedAnswer, onChange, mode = 'attempt' }) => {
  const isMCQ = question.options && question.options.length > 0;
  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm backdrop-blur-md">
      {/* Index Badge */}
      <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
        Question {index + 1} of {total}
      </span>
      {/* Question Text */}
      <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
        {question.question}
      </h3>
      {/* Answer Options Grid / Input Textarea */}
      {isMCQ ? (
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((opt, oIdx) => (
            <OptionButton
              key={oIdx}
              index={oIdx}
              text={opt}
              isSelected={selectedAnswer === opt}
              onClick={() => onChange(opt)}
              disabled={mode === 'review'}
              status={
                mode === 'review'
                  ? opt === question.correct_answer
                    ? 'correct'
                    : selectedAnswer === opt
                      ? 'wrong'
                      : 'default'
                  : 'default'
              }
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {mode === 'attempt' ? (
            <textarea
              rows={4}
              value={selectedAnswer || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Type your answer here in detail..."
              className="w-full bg-slate-900/40 border border-slate-800 focus:border-slate-700/85 rounded-2xl p-4 text-sm text-white placeholder-slate-550 outline-hidden focus:ring-0 resize-none transition-colors"
            />
          ) : (
            <div className="space-y-4">
              {/* Student's answer */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Your Submission</span>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {selectedAnswer || "(No answer submitted)"}
                </p>
              </div>
              {/* Reference correct answer */}
              <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-2xl p-4 text-emerald-400">
                <span className="text-[9px] font-bold text-emerald-450 uppercase tracking-wider block mb-1">Reference Correct Answer</span>
                <p className="text-sm leading-relaxed font-medium">
                  {question.correct_answer}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default QuestionCard;
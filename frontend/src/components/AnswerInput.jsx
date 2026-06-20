import { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
const AnswerInput = ({ value, onChange, onSubmit, disabled, placeholder = 'Type your answer here...' }) => {
  const textareaRef = useRef(null);
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 280)}px`;
    }
  }, [value]);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };
  return (
    <div className="bg-slate-900/40 border border-slate-800/70 rounded-3xl p-4 backdrop-blur-md shadow-xs">
      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Your Answer</label>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-slate-950/40 border border-slate-800/70 focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none resize-none transition-colors disabled:opacity-50 leading-relaxed"
        style={{ minHeight: '100px' }}
      />
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-600 font-medium">
            {value.length} chars · <span className="text-slate-700">Ctrl+Enter to submit</span>
          </span>
        </div>
        <button
          id="viva-submit-answer"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
          Submit Answer
        </button>
      </div>
    </div>
  );
};
export default AnswerInput;
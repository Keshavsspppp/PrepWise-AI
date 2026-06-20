import { useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';
const ChatInput = ({ value, onChange, onSubmit, loading, placeholder = "Ask a question about your study notes..." }) => {
  const textareaRef = useRef(null);
  // Auto grow height handler
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [value]);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && value.trim()) {
        onSubmit();
      }
    }
  };
  return (
    <form 
      onSubmit={(e) => { 
        e.preventDefault(); 
        if (!loading && value.trim()) onSubmit(); 
      }} 
      className="relative bg-slate-905/70 border border-slate-800 focus-within:border-slate-700/80 rounded-2xl flex items-end p-2.5 gap-2 transition-all duration-200"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={loading}
        className="flex-1 max-h-40 resize-none bg-transparent py-2.5 px-3.5 border-0 outline-hidden focus:ring-0 text-sm text-text-primary placeholder-slate-550 w-full"
      />
      <div className="flex items-center gap-2 pb-1 pr-1 flex-shrink-0">
        <span className="hidden md:flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none mr-2">
          <span>Enter</span>
          <CornerDownLeft className="h-3 w-3" />
        </span>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-neon-gradient text-white hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 transition-all duration-200 cursor-pointer shadow-md shadow-primary/20"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};
export default ChatInput;
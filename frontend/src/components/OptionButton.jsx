const OptionButton = ({ text, index, isSelected, onClick, disabled, status = 'default' }) => {
  const letters = ['A', 'B', 'C', 'D'];
  const letter = letters[index] || String.fromCharCode(65 + index);
  // Style helpers based on states
  const getStyles = () => {
    if (status === 'correct') {
      return 'bg-emerald-950/20 border-emerald-500/80 text-emerald-400 font-semibold shadow-xs';
    }
    if (status === 'wrong') {
      return 'bg-red-950/20 border-red-500/80 text-red-400 font-semibold shadow-xs';
    }
    if (isSelected) {
      return 'bg-indigo-950/20 border-indigo-500 text-white font-semibold shadow-xs shadow-indigo-550/10';
    }
    return 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white';
  };
  const getLetterStyles = () => {
    if (status === 'correct') {
      return 'bg-emerald-500 text-white';
    }
    if (status === 'wrong') {
      return 'bg-red-500 text-white';
    }
    if (isSelected) {
      return 'bg-indigo-500 text-white';
    }
    return 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white';
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border flex items-center gap-4 transition-all duration-200 group ${disabled ? 'cursor-default' : 'cursor-pointer'} ${getStyles()}`}
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 ${getLetterStyles()}`}>
        {letter}
      </div>
      <span className="text-sm leading-relaxed">{text}</span>
    </button>
  );
};
export default OptionButton;
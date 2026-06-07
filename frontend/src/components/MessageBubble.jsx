import React from 'react';
import { Sparkles, User, BrainCircuit } from 'lucide-react';
import SourceCard from './SourceCard';

const parseInlineStyles = (line) => {
  // Support bold **text**
  const boldParts = line.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((bPart, idx) => {
    if (bPart.startsWith('**') && bPart.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-white">{bPart.slice(2, -2)}</strong>;
    }
    
    // Support inline code `code`
    const inlineParts = bPart.split(/(`.*?`)/g);
    return inlineParts.map((iPart, iIdx) => {
      if (iPart.startsWith('`') && iPart.endsWith('`')) {
        return (
          <code key={iIdx} className="bg-slate-900/65 px-1.5 py-0.5 rounded text-cyan-400 font-mono text-[12px] border border-slate-800">
            {iPart.slice(1, -1)}
          </code>
        );
      }
      return iPart;
    });
  });
};

const parseText = (text) => {
  if (!text) return '';
  
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      // It's a code block
      const match = part.match(/```(\w*)\n([\s\S]*?)```/);
      const language = match ? match[1] : '';
      const code = match ? match[2] : part.slice(3, -3);
      return (
        <pre key={index} className="bg-slate-950/90 text-slate-100 p-4 rounded-xl my-3 overflow-x-auto border border-slate-800/80 text-xs font-mono shadow-inner">
          {language && (
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 border-b border-slate-900 pb-1">
              {language}
            </div>
          )}
          <code className="block leading-relaxed whitespace-pre">{code.trim()}</code>
        </pre>
      );
    }
    
    // Otherwise, parse inline styling: bold, list items, paragraphs
    const lines = part.split('\n');
    return lines.map((line, lIdx) => {
      // Check for bullet lists
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const cleanContent = line.trim().substring(2);
        return (
          <li key={`${index}-${lIdx}`} className="ml-5 list-disc my-1.5 text-sm text-slate-300">
            {parseInlineStyles(cleanContent)}
          </li>
        );
      }
      
      // Check for numbered lists
      const numListMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numListMatch) {
        return (
          <li key={`${index}-${lIdx}`} className="ml-5 list-decimal my-1.5 text-sm text-slate-300">
            {parseInlineStyles(numListMatch[2])}
          </li>
        );
      }
      
      // Default paragraph
      if (line.trim() === '') {
        return <div key={`${index}-${lIdx}`} className="h-2" />;
      }
      
      return (
        <p key={`${index}-${lIdx}`} className="text-sm text-slate-300 leading-relaxed my-2">
          {parseInlineStyles(line)}
        </p>
      );
    });
  });
};

const MessageBubble = ({ message }) => {
  const { sender, text, sources, error } = message;
  const isAI = sender === 'ai';

  return (
    <div className={`flex w-full gap-4 py-6 border-b border-slate-800/20 ${isAI ? 'bg-slate-900/10' : ''}`}>
      {/* Avatar column */}
      <div className="flex-shrink-0">
        {isAI ? (
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-neon-gradient text-white shadow-xs">
            <BrainCircuit className="h-4.5 w-4.5" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            <User className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      {/* Message content column */}
      <div className="flex-1 space-y-4 overflow-hidden">
        {/* Header label */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wide uppercase text-slate-450">
            {isAI ? 'StudyGenie AI' : 'You'}
          </span>
        </div>

        {/* Message Text / Markdown Output */}
        <div className="prose prose-invert max-w-none">
          {error ? (
            <p className="text-sm text-error font-medium bg-error/10 border border-error/20 rounded-xl px-4 py-3">
              {text}
            </p>
          ) : (
            parseText(text)
          )}
        </div>

        {/* Citations/Sources block */}
        {isAI && sources && sources.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-850">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Grounded Sources Used ({sources.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {sources.map((src, idx) => (
                <SourceCard key={idx} filename={src.filename} subject={src.subject} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

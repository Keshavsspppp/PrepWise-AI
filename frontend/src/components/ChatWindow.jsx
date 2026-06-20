import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { BrainCircuit } from 'lucide-react';

const ChatWindow = ({ messages, loading }) => {
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);
  return (
    <div className="flex flex-col h-full overflow-y-auto px-1 md:px-4">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-6">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-neon-gradient text-white shadow-lg shadow-primary/20 animate-bounce duration-1000">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-3 px-4">
            <h2 className="text-xl font-display font-bold text-text-primary">
              AI Study Assistant
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Ask questions about your uploaded study notes! The assistant retrieves relevant content from your PDF documents and answers questions grounded strictly in your notes.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-slate-800/10 pb-4">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}
          {loading && (
            <div className="flex w-full gap-4 py-8">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-neon-gradient text-white shadow-xs">
                  <BrainCircuit className="h-4.5 w-4.5 animate-spin" />
                </div>
              </div>
              <div className="flex-1 space-y-3.5">
                <span className="text-xs font-bold tracking-wide uppercase text-slate-450">
                  PrepWise AI is thinking...
                </span>
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default ChatWindow;

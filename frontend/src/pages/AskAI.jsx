import React, { useState, useEffect } from 'react';
import { Trash2, MessageSquare, Sparkles, AlertCircle } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import API from '../api/axios';

const AskAI = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('studygenie_chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Persist chat history
  useEffect(() => {
    localStorage.setItem('studygenie_chat_history', JSON.stringify(messages));
  }, [messages]);

  const quickQuestions = [
    { text: 'Explain Merge Sort.', subject: 'DSA' },
    { text: 'What is normalization?', subject: 'DBMS' },
    { text: 'Explain deadlock in OS.', subject: 'Operating Systems' },
    { text: 'What is Dijkstra Algorithm?', subject: 'DSA' }
  ];

  const handleSendMessage = async (customQuestion = null) => {
    const questionText = (customQuestion || input).trim();
    if (!questionText) return;

    // Clear main page error
    setError('');

    // Append User message
    const userMessage = { sender: 'user', text: questionText };
    setMessages((prev) => [...prev, userMessage]);
    
    if (!customQuestion) {
      setInput(''); // clear input if it wasn't a template click
    }

    setLoading(true);

    try {
      const response = await API.post('/ai/chat', { question: questionText });
      
      const aiMessage = {
        sender: 'ai',
        text: response.data.answer,
        sources: response.data.sources || []
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI chat failed:', err);
      let errMsg = 'Failed to generate answer from notes. Please try again.';
      if (err.response && err.response.data && err.response.data.detail) {
        errMsg = err.response.data.detail;
      }
      
      const errorBubble = {
        sender: 'ai',
        text: errMsg,
        error: true
      };
      
      setMessages((prev) => [...prev, errorBubble]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError('');
    localStorage.removeItem('studygenie_chat_history');
  };

  return (
    <DashboardLayout currentPage="AI Study Assistant">
      <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[480px]">
        {/* Chat card */}
        <div className="flex-1 bg-dark-card/60 border border-slate-800/40 rounded-3xl shadow-xl overflow-hidden flex flex-col backdrop-blur-md relative">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/40 bg-slate-900/20">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm text-text-primary">Grounded Chat Session</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-semibold text-text-secondary hover:text-white transition-all cursor-pointer border border-slate-800 hover:border-slate-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Chat
              </button>
            )}
          </div>

          {/* Chat scrolling area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
            <ChatWindow messages={messages} loading={loading} />
            
            {/* Quick Questions Display when chat is empty */}
            {messages.length === 0 && (
              <div className="max-w-2xl mx-auto px-4 pb-12">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Quick Grounded Prompts
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q.text)}
                      className="text-left px-5 py-4 rounded-2xl bg-slate-900/40 hover:bg-slate-850 border border-slate-800/50 hover:border-slate-700/80 transition-all duration-200 group cursor-pointer"
                    >
                      <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {q.text}
                      </p>
                      <span className="inline-block text-[9px] font-bold text-cyan-400 bg-cyan-900/20 px-1.5 py-0.5 rounded-sm mt-2 uppercase tracking-wider">
                        {q.subject}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat input box footer */}
          <div className="p-4 md:p-6 border-t border-slate-800/40 bg-slate-900/10">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => handleSendMessage()}
              loading={loading}
              placeholder="Ask a question (e.g. 'Explain Merge Sort' or 'What is normalization?')..."
            />
            <p className="text-[11px] text-text-secondary text-center mt-3">
              Answers are grounded strictly in your study notes and cite source PDFs.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AskAI;

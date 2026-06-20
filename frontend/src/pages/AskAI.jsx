import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Sparkles, Send, Bot, User } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import API from '../api/axios';

const PROMPTS = [
  { text: 'Explain Merge Sort.',              subject: 'DSA' },
  { text: 'What is database normalization?',  subject: 'DBMS' },
  { text: 'Explain deadlock in OS.',          subject: 'OS' },
  { text: "What is Dijkstra's Algorithm?",    subject: 'DSA' },
  { text: 'Explain TCP/IP model layers.',     subject: 'CN' },
  { text: 'What is process scheduling?',      subject: 'OS' },
];

const Bubble = ({ msg }) => {
  const isUser = msg.sender === 'user';
  return (
    <div style={{ display: 'flex', gap: '0.625rem', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
      <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: 'var(--radius-sm)', background: isUser ? 'var(--amber-dim)' : 'var(--teal-dim)', border: `1px solid ${isUser ? 'var(--amber-border)' : 'var(--teal-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.25rem' }}>
        {isUser ? <User size={12} style={{ color: 'var(--amber)' }} /> : <Bot size={12} style={{ color: 'var(--teal)' }} />}
      </div>
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: '0.375rem', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
          background: isUser ? 'var(--amber)' : msg.error ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)',
          border: `1px solid ${isUser ? 'var(--amber)' : msg.error ? 'rgba(239,68,68,0.2)' : 'var(--border-strong)'}`,
          color: isUser ? '#0a0a0f' : msg.error ? '#f87171' : 'var(--text-primary)',
          fontSize: '0.9rem', lineHeight: 1.65,
          borderTopRightRadius: isUser ? 'var(--radius-sm)' : 'var(--radius-md)',
          borderTopLeftRadius: isUser ? 'var(--radius-md)' : 'var(--radius-sm)',
        }}>
          {msg.text}
        </div>
        {msg.sources?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {msg.sources.map((s, i) => (
              <span key={i} className="badge badge-teal" style={{ fontSize: '0.65rem' }}>
                📄 {typeof s === 'string' ? s : s.filename || s.source || 'Source'}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Typing = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
    <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--teal-dim)', border: '1px solid var(--teal-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Bot size={12} style={{ color: 'var(--teal)' }} />
    </div>
    <div style={{ display: 'flex', gap: '4px', padding: '0.625rem 0.875rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', borderTopLeftRadius: 'var(--radius-sm)' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'bounce-dot 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  </div>
);

const AskAI = () => {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('prepwise_chat') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('prepwise_chat', JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages(p => [...p, { sender: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await API.post('/ai/chat', { question: q });
      setMessages(p => [...p, { sender: 'ai', text: res.data.answer, sources: res.data.sources || [] }]);
    } catch (err) {
      setMessages(p => [...p, { sender: 'ai', text: err.response?.data?.detail || 'Failed to get answer. Try again.', error: true }]);
    } finally { setLoading(false); inputRef.current?.focus(); }
  };

  return (
    <DashboardLayout currentPage="AI Study Assistant">
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 7rem)' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)', background: 'var(--teal-dim)', border: '1px solid var(--teal-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} style={{ color: 'var(--teal)' }} />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Gemini Study Assistant</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Grounded in your uploaded notes only</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-teal">
                <span className="dot-live" style={{ background: 'var(--teal)', animation: 'pulse-glow 2s infinite' }} />
                RAG Active
              </span>
              {messages.length > 0 && (
                <button
                  onClick={() => { setMessages([]); localStorage.removeItem('prepwise_chat'); }}
                  className="btn btn-ghost btn-sm"
                >
                  <Trash2 size={13} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
            {messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1.75rem', paddingBottom: '2rem' }}>
                <div className="animate-float">
                  <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--teal-dim)', border: '1px solid var(--teal-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <Sparkles size={20} style={{ color: 'var(--teal)' }} />
                  </div>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Ask Anything</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '22rem' }}>Your AI tutor answers from your uploaded notes only — no hallucinations.</p>
                </div>
                <div style={{ width: '100%', maxWidth: '28rem' }}>
                  <p className="label" style={{ marginBottom: '0.75rem' }}>Suggested prompts</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.5rem' }}>
                    {PROMPTS.map((q, i) => (
                      <button key={i} onClick={() => send(q.text)} style={{
                        textAlign: 'left', padding: '0.75rem 0.875rem',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all var(--transition)',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber-border)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                      >
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>{q.text}</p>
                        <span className="badge badge-amber">{q.subject}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {messages.map((m, i) => <Bubble key={i} msg={m} />)}
            {loading && <Typing />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                disabled={loading}
                rows={1}
                placeholder="Ask a question from your notes… (Enter to send)"
                className="input-field"
                style={{ flex: 1, resize: 'none', minHeight: '2.75rem', maxHeight: '8rem' }}
              />
              <button onClick={() => send()} disabled={!input.trim() || loading} className="btn btn-primary" style={{ padding: '0.625rem 0.875rem', flexShrink: 0 }}>
                <Send size={15} />
              </button>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.625rem' }}>Powered by Gemini 2.5 Flash · Strictly grounded in your uploaded notes</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AskAI;



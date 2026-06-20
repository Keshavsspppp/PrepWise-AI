import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const S = {
  page: { minHeight: '100vh', display: 'flex', background: 'var(--bg-base)', fontFamily: 'var(--font-body)' },
  side: {
    width: '44%', flexShrink: 0,
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border)',
    padding: '3rem',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
  },
  panel: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  wrap: { width: '100%', maxWidth: '22rem' },
};

const features = [
  { icon: '🧠', label: 'AI-powered answers from your own notes' },
  { icon: '📊', label: 'Learning DNA mastery tracking' },
  { icon: '🔁', label: 'Forgetting curve revision engine' },
  { icon: '🎤', label: 'AI Mock Viva with live scoring' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError(''); setLoading(true);
    const r = await login(email, password);
    setLoading(false);
    if (r.success) navigate('/dashboard');
    else setError(r.error);
  };

  return (
    <div style={S.page}>
      {/* Feature side — hidden on small screens */}
      <div style={S.side} className="auth-side">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--amber), #e07b09)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1rem' }}>✦</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>PrepWise AI</span>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '0.75rem' }}>
            Study smarter,<br />
            <span style={{ color: 'var(--amber)' }}>not harder.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
            Your AI companion that learns how <em>you</em> learn.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {features.map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{f.icon}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{f.label}</span>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 'auto', paddingTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>© 2025 PrepWise AI · Gemini 2.5 Flash</p>
      </div>

      {/* Form panel */}
      <div style={S.panel}>
        <div style={S.wrap}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.375rem' }}>Welcome back</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to continue your learning journey.</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Email */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Email address</label>
              <div className="input-icon">
                <Mail size={15} className="icon" />
                <input id="login-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="label">Password</label>
                <a href="#/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 500 }}>Forgot?</a>
              </div>
              <div className="input-icon">
                <Lock size={15} className="icon" />
                <input id="login-password" type={show ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field has-right" />
                <button type="button" onClick={() => setShow(!show)} className="icon icon-right" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" disabled={loading} className="btn btn-primary btn-block" style={{ marginTop: '0.5rem', padding: '0.875rem' }}>
              {loading ? <><Spinner /> Signing in…</> : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            New to PrepWise?{' '}
            <a href="#/register" style={{ color: 'var(--amber)', fontWeight: 600 }}>Create account</a>
          </div>
        </div>
      </div>
    </div>
  );
};

const Spinner = () => (
  <span style={{
    width: '1rem', height: '1rem', border: '2px solid rgba(10,10,15,0.3)',
    borderTop: '2px solid #0a0a0f', borderRadius: '50%',
    display: 'inline-block', animation: 'spin 0.8s linear infinite',
  }} />
);

export default Login;

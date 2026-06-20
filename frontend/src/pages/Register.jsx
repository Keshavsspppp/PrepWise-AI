import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Spinner = () => (
  <span style={{ width: '1rem', height: '1rem', border: '2px solid rgba(10,10,15,0.3)', borderTop: '2px solid #0a0a0f', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
);

const getStrength = (pwd) => {
  if (!pwd) return null;
  const checks = [pwd.length >= 8, /[A-Z]/.test(pwd), /[0-9]/.test(pwd), /[^A-Za-z0-9]/.test(pwd)];
  const score = checks.filter(Boolean).length;
  if (score < 2) return { label: 'Weak',   w: '25%',  color: '#ef4444' };
  if (score < 3) return { label: 'Fair',   w: '50%',  color: '#f59e0b' };
  if (score < 4) return { label: 'Good',   w: '75%',  color: '#06b6d4' };
  return           { label: 'Strong', w: '100%', color: '#10b981' };
};

const perks = [
  'AI Q&A grounded in your uploaded PDFs',
  'Auto-scheduled Ebbinghaus revision engine',
  'Learning DNA mastery & retention profiling',
  'AI Mock Viva with live evaluation & scoring',
];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    const r = await register(name, email, password);
    setLoading(false);
    if (r.success) navigate('/dashboard');
    else setError(r.error);
  };

  const strength = getStrength(password);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)', fontFamily: 'var(--font-body)' }}>
      {/* Left side */}
      <div className="auth-side">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--amber), #e07b09)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1rem' }}>✦</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem' }}>PrepWise AI</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.15 }}>
          Start your AI<br /><span style={{ color: 'var(--amber)' }}>learning journey</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Free forever. No credit card required.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '2.5rem' }}>
          {perks.map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{p}</span>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span>
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>"PrepWise helped me score 92% in my OS exam"</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>— Priya S., CS Student</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '22rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.375rem' }}>Create account</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join thousands of students studying smarter.</p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            {/* Name */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
              <div className="input-icon">
                <User size={15} className="icon" />
                <input id="register-name" type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className="input-field" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
              <div className="input-icon">
                <Mail size={15} className="icon" />
                <input id="register-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
              <div className="input-icon">
                <Lock size={15} className="icon" />
                <input id="register-password" type={show ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="input-field has-right" />
                <button type="button" onClick={() => setShow(!show)} className="icon icon-right" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password && strength && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ height: '3px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden', marginBottom: '0.25rem' }}>
                    <div style={{ height: '100%', width: strength.w, background: strength.color, borderRadius: '100px', transition: 'all 0.3s' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 500 }}>Strength: {strength.label}</span>
                </div>
              )}
            </div>

            <button id="register-submit" type="submit" disabled={loading} className="btn btn-primary btn-block" style={{ padding: '0.875rem', marginTop: '0.5rem' }}>
              {loading ? <><Spinner /> Creating account…</> : <>Create Account <ArrowRight size={15} /></>}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              By signing up you agree to our Terms & Privacy Policy.
            </p>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <a href="#/login" style={{ color: 'var(--amber)', fontWeight: 600 }}>Sign in</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

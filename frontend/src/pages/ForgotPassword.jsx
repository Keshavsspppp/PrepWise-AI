import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import API from '../api/axios';
const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', fontFamily: 'var(--font-body)', padding: '2rem' },
  wrap: { width: '100%', maxWidth: '24rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
};
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setError(''); setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send password reset request. Please check the email address.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={S.page}>
      <div style={S.wrap}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', alignSelf: 'center', marginBottom: '0.5rem' }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--amber), #e07b09)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#fff' }}>✦</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>PrepWise AI</span>
        </div>
        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', alignItems: 'center' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} style={{ color: 'var(--teal)' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Check the logs</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Since SMTP is not configured, the password reset link has been logged to the backend terminal console. Copy that URL to reset your password.
              </p>
            </div>
            <button onClick={() => navigate('/login')} className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.375rem' }}>Forgot password?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                Enter your email address and we'll generate a reset link for you.
              </p>
            </div>
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Email address</label>
                <div className="input-icon">
                  <Mail size={15} className="icon" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-block" style={{ padding: '0.875rem' }}>
                {loading ? 'Sending Request...' : 'Send Reset Link'}
              </button>
            </form>
            <button onClick={() => navigate('/login')} className="btn btn-ghost btn-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};
export default ForgotPassword;
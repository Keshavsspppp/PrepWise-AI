import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import API from '../api/axios';
const S = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', fontFamily: 'var(--font-body)', padding: '2rem' },
  wrap: { width: '100%', maxWidth: '24rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
};
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) { setError('Please fill in all fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    
    // Client-side quick check matching user register rules
    if (password.length < 8) { setError('Password must be at least 8 characters long.'); return; }
    if (!/[0-9]/.test(password)) { setError('Password must contain at least one digit.'); return; }
    if (!/[A-Z]/.test(password)) { setError('Password must contain at least one uppercase letter.'); return; }
    if (!/[a-z]/.test(password)) { setError('Password must contain at least one lowercase letter.'); return; }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) { setError('Password must contain at least one special character (!@#$%^&* etc.).'); return; }
    setError(''); setLoading(true);
    try {
      await API.post('/auth/reset-password', {
        email,
        token,
        new_password: password
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired or is invalid.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={S.page}>
      <div style={S.wrap}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', alignSelf: 'center', marginBottom: '0.5rem' }}>
          <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--btn-primary-text)' }}>✦</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>PrepWise AI</span>
        </div>
        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', alignItems: 'center' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Password reset complete</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
            </div>
            <button onClick={() => navigate('/login')} className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }}>
              Go to Sign In
            </button>
          </div>
        ) : !token || !email ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', alignItems: 'center' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: 'var(--color-danger-dim)', border: '1px solid var(--color-danger-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={24} style={{ color: 'var(--color-danger)' }} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Invalid reset link</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                This password reset link is invalid or missing required parameters. Please request a new link.
              </p>
            </div>
            <button onClick={() => navigate('/forgot-password')} className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }}>
              Request New Link
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.375rem' }}>Reset password</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                Enter your new password below for {email}.
              </p>
            </div>
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              {/* Password */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                <div className="input-icon">
                  <Lock size={15} className="icon" />
                  <input type={show ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field has-right" />
                  <button type="button" onClick={() => setShow(!show)} className="icon icon-right" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.375rem', lineHeight: 1.3 }}>
                  Must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.
                </p>
              </div>
              {/* Confirm Password */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm New Password</label>
                <div className="input-icon">
                  <Lock size={15} className="icon" />
                  <input type={show ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="input-field" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-block" style={{ padding: '0.875rem', marginTop: '0.5rem' }}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
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
export default ResetPassword;
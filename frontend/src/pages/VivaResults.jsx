import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import DashboardLayout from '../layouts/DashboardLayout';
import VivaSummary from '../components/VivaSummary';
import { ArrowLeft, RotateCcw, History } from 'lucide-react';
const VivaResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state;
  const [results, setResults] = useState(state?.results || null);
  const [loading, setLoading] = useState(!results && !!state?.vivaId);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!results && state?.vivaId) {
      API.get(`/viva/results/${state.vivaId}`)
        .then(res => setResults(res.data))
        .catch(err => setError(err.response?.data?.detail || 'Failed to load results.'))
        .finally(() => setLoading(false));
    } else if (!results && !state?.vivaId) {
      navigate('/viva');
    }
  }, [results, state?.vivaId, navigate]);
  if (loading) return (
    <DashboardLayout currentPage="Viva Results">
      <div style={{ padding: '6rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '2.5rem', height: '2.5rem', border: '2px solid var(--color-accent-dim)', borderTop: '2px solid var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading results…</p>
      </div>
    </DashboardLayout>
  );
  return (
    <DashboardLayout currentPage="Viva Results">
      <div style={{ maxWidth: '42rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button onClick={() => navigate('/viva')} className="btn btn-ghost btn-sm" style={{ padding: '0.375rem' }} aria-label="Back to mock viva">
              <ArrowLeft size={15} />
            </button>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>Viva Results</h1>
              {results && <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.125rem' }}>{results.subject} · {results.difficulty}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => navigate('/viva/history')} className="btn btn-ghost btn-sm">
              <History size={13} /> History
            </button>
            <button onClick={() => navigate('/viva')} className="btn btn-accent btn-sm">
              <RotateCcw size={13} /> Retake
            </button>
          </div>
        </div>
        {error && (
          <div className="alert alert-error">{error}</div>
        )}
        {results && <VivaSummary {...results} />}
      </div>
    </DashboardLayout>
  );
};
export default VivaResults;
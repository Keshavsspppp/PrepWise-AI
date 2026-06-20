import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertCircle, X, CloudUpload } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import API from '../api/axios';

const SUBJECTS = ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude', 'Other'];

const UploadNotes = () => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('DSA');
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const validate = (f) => {
    setError(''); setSuccess('');
    if (!f) return false;
    if (!f.name.toLowerCase().endsWith('.pdf')) { setError('Only PDF files are accepted.'); return false; }
    if (f.size > 20 * 1024 * 1024) { setError(`File too large (${(f.size/1048576).toFixed(1)} MB). Max 20 MB.`); return false; }
    return true;
  };
  const pick = (f) => { if (validate(f)) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^/.]+$/, '')); } };
  const onDrag = (e) => { e.preventDefault(); setDrag(e.type === 'dragenter' || e.type === 'dragover'); };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Please provide a title.'); return; }
    if (!file) { setError('Please select a PDF.'); return; }
    setError(''); setSuccess(''); setUploading(true); setProgress(0);
    const form = new FormData();
    form.append('title', title); form.append('subject', subject); form.append('file', file);
    try {
      await API.post('/notes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ev => setProgress(Math.round((ev.loaded * 100) / ev.total)),
      });
      setSuccess('Notes uploaded and indexed!');
      setTitle(''); setFile(null);
      setTimeout(() => navigate('/notes/list'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  return (
    <DashboardLayout currentPage="Upload Notes">
      <div style={{ maxWidth: '36rem', margin: '0 auto' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--amber-dim) 0%, transparent 70%)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloudUpload size={16} color="#0a0a0f" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem' }}>Upload Study Notes</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF documents are indexed for AI-grounded Q&A and quizzes</p>
            </div>
          </div>

          <form onSubmit={submit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && <div className="alert alert-error"><AlertCircle size={15} style={{ flexShrink: 0 }} />{error}</div>}
            {success && <div className="alert alert-success"><CheckCircle2 size={15} style={{ flexShrink: 0 }} />{success}</div>}

            {/* Title + Subject */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.875rem' }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Document Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Intro to Dynamic Programming" className="input-field" />
              </div>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Drop zone */}
            <div>
              <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>PDF File</label>
              {!file ? (
                <div
                  onDragEnter={onDrag} onDragOver={onDrag} onDragLeave={() => setDrag(false)} onDrop={onDrop}
                  onClick={() => fileRef.current.click()}
                  style={{
                    border: `2px dashed ${drag ? 'var(--amber)' : 'var(--border-strong)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 1.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.875rem',
                    textAlign: 'center', cursor: 'pointer',
                    background: drag ? 'var(--amber-dim)' : 'var(--bg-elevated)',
                    transition: 'all var(--transition)',
                    transform: drag ? 'scale(1.01)' : 'none',
                  }}
                >
                  <input ref={fileRef} type="file" accept=".pdf" onChange={e => pick(e.target.files[0])} style={{ display: 'none' }} />
                  <div style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius-md)', background: drag ? 'var(--amber)' : 'var(--amber-dim)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={18} style={{ color: drag ? '#0a0a0f' : 'var(--amber)' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      Drop PDF here, or <span style={{ color: 'var(--amber)' }}>browse</span>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>PDF only · Max 20 MB</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
                  <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-sm)', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={15} style={{ color: '#f87171' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size/1048576).toFixed(2)} MB</p>
                  </div>
                  {!uploading && (
                    <button type="button" onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                      <X size={15} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Progress */}
            {uploading && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Uploading & indexing…</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{progress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="divider" />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" disabled={uploading} onClick={() => navigate('/notes/list')} className="btn btn-ghost">Cancel</button>
              <button type="submit" disabled={uploading} className="btn btn-primary">
                {uploading ? 'Uploading…' : <><Upload size={14} /> Upload Notes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UploadNotes;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, FileText, Trash2, Download, Calendar, HardDrive, Inbox, Plus, AlertCircle, Upload, CheckCircle2, X, CloudUpload } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import API from '../api/axios';
import Reveal from '../components/Reveal';

const SUBJECTS = ['All', 'DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude', 'Other'];

const SUBJECT_COLORS = {
  DSA:               { color: 'var(--amber)', dim: 'var(--amber-dim)', border: 'var(--amber-border)' },
  DBMS:              { color: '#818cf8', dim: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' },
  'Operating Systems':{ color: '#fb923c', dim: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)' },
  'Computer Networks':{ color: 'var(--teal)', dim: 'var(--teal-dim)', border: 'var(--teal-border)' },
  Aptitude:          { color: '#f472b6', dim: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)' },
  Other:             { color: 'var(--text-muted)', dim: 'var(--border)', border: 'var(--border-strong)' },
};

const fmtBytes = (b) => { if (!b) return '0 B'; const k = 1024; const s = ['B','KB','MB','GB']; const i = Math.floor(Math.log(b)/Math.log(k)); return `${(b/Math.pow(k,i)).toFixed(1)} ${s[i]}`; };
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const NotesList = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const limit = 12;
  const navigate = useNavigate();

  // Integrated Upload States
  const [showUpload, setShowUpload] = useState(searchParams.get('upload') === 'true');

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('DSA');
  const [uploadFile, setUploadFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileRef = useRef(null);

  const fetch = async () => {
    setLoading(true); setError('');
    try { 
      const r = await API.get('/notes', { params: { q: search, subject, page, limit } }); 
      setNotes(r.data); 
      const total = r.headers['x-total-count'];
      if (total) {
        setTotalCount(parseInt(total, 10));
      } else {
        setTotalCount(r.data.length);
      }
    }
    catch { setError('Failed to load notes. Please check your connection.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setPage(1);
  }, [search, subject]);

  useEffect(() => { const t = setTimeout(fetch, 300); return () => clearTimeout(t); }, [search, subject, page]);

  const del = async (id) => {
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    setDeleting(id);
    try { await API.delete(`/notes/${id}`); setNotes(p => p.filter(n => n.id !== id)); }
    catch (err) { alert(err.response?.data?.detail || 'Failed to delete.'); }
    finally { setDeleting(null); }
  };

  const dl = async (id, filename) => {
    try {
      const r = await API.get(`/notes/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.setAttribute('download', filename);
      document.body.appendChild(a); a.click(); a.remove();
    } catch { alert('Download failed.'); }
  };

  // Upload Handlers
  const validateUpload = (f) => {
    setUploadError(''); setUploadSuccess('');
    if (!f) return false;
    if (!f.name.toLowerCase().endsWith('.pdf')) { setUploadError('Only PDF files are accepted.'); return false; }
    if (f.size > 20 * 1024 * 1024) { setUploadError(`File too large (${(f.size/1048576).toFixed(1)} MB). Max 20 MB.`); return false; }
    return true;
  };
  const pickUpload = (f) => { if (validateUpload(f)) { setUploadFile(f); if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^/.]+$/, '')); } };
  const onDrag = (e) => { e.preventDefault(); setDrag(e.type === 'dragenter' || e.type === 'dragover'); };
  const onDrop = (e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) pickUpload(e.dataTransfer.files[0]); };

  const submitUpload = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) { setUploadError('Please provide a title.'); return; }
    if (!uploadFile) { setUploadError('Please select a PDF.'); return; }
    setUploadError(''); setUploadSuccess(''); setUploading(true); setProgress(0);
    const form = new FormData();
    form.append('title', uploadTitle); form.append('subject', uploadSubject); form.append('file', uploadFile);
    try {
      await API.post('/notes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ev => setProgress(Math.round((ev.loaded * 100) / ev.total)),
      });
      setUploadSuccess('Notes uploaded and indexed successfully!');
      setUploadTitle(''); setUploadFile(null);
      setTimeout(() => {
        setShowUpload(false);
        setUploadSuccess('');
        fetch();
      }, 1500);
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  const cfg = (s) => SUBJECT_COLORS[s] || SUBJECT_COLORS.Other;

  return (
    <DashboardLayout currentPage="Notes Manager">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="input-icon" style={{ flex: 1, minWidth: '12rem', maxWidth: '20rem' }}>
            <Search size={15} className="icon" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…" className="input-field" />
          </div>
          <button onClick={() => setShowUpload(!showUpload)} className="btn btn-primary">
            {showUpload ? <X size={14} /> : <Plus size={14} />} {showUpload ? 'Close' : 'Upload Notes'}
          </button>
        </div>

        {/* Integrated Upload Panel */}
        {showUpload && (
          <div className="animate-fade-up" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--amber-dim) 0%, transparent 70%)', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloudUpload size={15} color="#0a0a0f" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9375rem' }}>Upload Study Notes</h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PDF documents are indexed for AI-grounded Q&A and quizzes</p>
              </div>
            </div>

            <form onSubmit={submitUpload} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {uploadError && <div className="alert alert-error"><AlertCircle size={14} style={{ flexShrink: 0 }} />{uploadError}</div>}
              {uploadSuccess && <div className="alert alert-success"><CheckCircle2 size={14} style={{ flexShrink: 0 }} />{uploadSuccess}</div>}

              {/* Title + Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: '0.375rem' }}>Document Title</label>
                  <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="e.g. Intro to Dynamic Programming" className="input-field" />
                </div>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: '0.375rem' }}>Subject</label>
                  <select value={uploadSubject} onChange={e => setUploadSubject(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
                    {SUBJECTS.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Drop zone */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '0.375rem' }}>PDF File</label>
                {!uploadFile ? (
                  <div
                    onDragEnter={onDrag} onDragOver={onDrag} onDragLeave={() => setDrag(false)} onDrop={onDrop}
                    onClick={() => fileRef.current.click()}
                    style={{
                      border: `2px dashed ${drag ? 'var(--amber)' : 'var(--border-strong)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '2rem 1rem',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                      textAlign: 'center', cursor: 'pointer',
                      background: drag ? 'var(--amber-dim)' : 'var(--bg-elevated)',
                      transition: 'all var(--transition)',
                      transform: drag ? 'scale(1.01)' : 'none',
                    }}
                  >
                    <input ref={fileRef} type="file" accept=".pdf" onChange={e => pickUpload(e.target.files[0])} style={{ display: 'none' }} />
                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: 'var(--radius-md)', background: drag ? 'var(--amber)' : 'var(--amber-dim)', border: '1px solid var(--amber-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Upload size={16} style={{ color: drag ? '#0a0a0f' : 'var(--amber)' }} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        Drop PDF here, or <span style={{ color: 'var(--amber)' }}>browse</span>
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>PDF only · Max 20 MB</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={14} style={{ color: '#f87171' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploadFile.name}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(uploadFile.size/1048576).toFixed(2)} MB</p>
                    </div>
                    {!uploading && (
                      <button type="button" onClick={() => setUploadFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Progress */}
              {uploading && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.375rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Uploading & indexing…</span>
                    <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{progress}%</span>
                  </div>
                  <div className="progress-track" style={{ height: '4px' }}>
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <div className="divider" />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" disabled={uploading} onClick={() => setShowUpload(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" disabled={uploading} className="btn btn-primary btn-sm">
                  {uploading ? 'Uploading…' : <><Upload size={13} /> Upload Notes</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Subject filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => setSubject(s)}
              className={subject === s ? '' : 'tag'}
              style={subject === s ? {
                padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.8rem',
                background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', color: 'var(--amber)',
                cursor: 'pointer', fontWeight: 600, transition: 'all var(--transition)',
              } : { cursor: 'pointer' }}
            >{s}</button>
          ))}
        </div>

        {error && <div className="alert alert-error"><AlertCircle size={15} style={{ flexShrink: 0 }} />{error}</div>}

        {loading ? (
          <div style={{ padding: '6rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '2rem', height: '2rem', border: '2px solid var(--amber-dim)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading documents…</p>
          </div>
        ) : notes.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.375rem' }}>No Notes Found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '20rem' }}>
                {search || subject !== 'All' ? 'Try adjusting filters or search.' : 'Upload your first PDF to get started.'}
              </p>
            </div>
            {!search && subject === 'All' && (
              <button onClick={() => setShowUpload(true)} className="btn btn-primary">
                <Plus size={14} /> Upload Now
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))', gap: '1rem' }}>
            {notes.map((note, i) => {
              const c = cfg(note.subject);
              return (
                <Reveal key={note.id} variant="pop" delay={Math.min(i, 6) * 60}>
                  <div style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    transition: 'all var(--transition)',
                    height: '100%'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    {/* Color band */}
                    <div style={{ height: '3px', background: c.color }} />
                    {/* Body */}
                    <div style={{ padding: '1.125rem', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.5rem', background: c.dim, border: `1px solid ${c.border}`, borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700, color: c.color, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{note.subject}</span>
                        <FileText size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </div>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{note.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.filename}</p>
                    </div>
                    {/* Footer */}
                    <div style={{ padding: '0.75rem 1.125rem', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.015)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={11} />{fmtDate(note.upload_date)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><HardDrive size={11} />{fmtBytes(note.filesize)}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button onClick={() => dl(note.id, note.filename)} className="btn btn-ghost btn-sm" style={{ justifyContent: 'center' }}>
                          <Download size={13} /> Download
                        </button>
                        <button onClick={() => del(note.id)} disabled={deleting === note.id} className="btn btn-danger btn-sm" style={{ justifyContent: 'center' }}>
                          {deleting === note.id
                            ? <span style={{ width: '12px', height: '12px', border: '2px solid rgba(248,113,113,0.3)', borderTop: '2px solid #f87171', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                            : <Trash2 size={13} />} Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}

        {!loading && notes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                className="btn btn-ghost btn-sm"
                style={{ cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Page {page} of {Math.ceil(totalCount / limit) || 1}
              </span>
              <button 
                disabled={page >= Math.ceil(totalCount / limit)} 
                onClick={() => setPage(p => p + 1)} 
                className="btn btn-ghost btn-sm"
                style={{ cursor: page >= Math.ceil(totalCount / limit) ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {notes.length} of {totalCount} {totalCount === 1 ? 'document' : 'documents'}{subject !== 'All' ? ` in ${subject}` : ''}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotesList;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  Trash2, 
  Download, 
  Calendar, 
  HardDrive, 
  Inbox, 
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import API from '../api/axios';

const NotesList = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();
  const subjects = ['All', 'DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude', 'Other'];

  const fetchNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/notes', {
        params: {
          q: searchQuery,
          subject: selectedSubject,
        },
      });
      setNotes(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch study notes. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchNotes();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedSubject]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this study note? This action cannot be undone.")) {
      return;
    }
    
    setDeletingId(id);
    try {
      await API.delete(`/notes/${id}`);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to delete note.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (id, filename) => {
    triggerSecureDownload(id, filename);
  };

  const triggerSecureDownload = async (id, filename) => {
    try {
      const response = await API.get(`/notes/${id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to download file. Please try again.');
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSubjectColor = (sub) => {
    const colors = {
      'DSA': 'bg-primary/10 text-primary border-primary/20',
      'DBMS': 'bg-secondary/10 text-secondary border-secondary/20',
      'Operating Systems': 'bg-warning/10 text-warning border-warning/20',
      'Computer Networks': 'bg-success/10 text-success border-success/20',
      'Aptitude': 'bg-accent/10 text-accent border-accent/20',
      'Other': 'bg-slate-800/40 text-text-secondary border-slate-700/20'
    };
    return colors[sub] || colors['Other'];
  };

  return (
    <DashboardLayout currentPage="Notes Manager">
      {/* Top Controls Grid */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-dark-card p-4 border border-slate-800/40 rounded-2xl shadow-xs glow-card">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by note title..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-sm focus:outline-hidden focus:border-primary focus:bg-slate-900/85 transition-all text-text-primary"
          />
        </div>
        
        {/* Add Notes CTA */}
        <button
          onClick={() => navigate('/notes/upload')}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-neon-gradient hover:opacity-95 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md shadow-primary/10 active:scale-97 cursor-pointer text-center glow-button"
        >
          <Plus className="h-4.5 w-4.5" />
          Upload Notes
        </button>
      </div>

      {/* Subject Filter Pills */}
      <div className="flex flex-wrap gap-2.5">
        {subjects.map((sub) => (
          <button
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`
              px-4 py-2 text-xs font-semibold rounded-full border transition-all duration-200 cursor-pointer
              ${selectedSubject === sub 
                ? 'bg-neon-gradient text-white border-transparent shadow-xs shadow-primary/20' 
                : 'bg-dark-card text-text-secondary border-slate-800/50 hover:bg-slate-800 hover:text-white'}
            `}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid / Loader */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Retrieving documents...</p>
        </div>
      ) : notes.length === 0 ? (
        /* Empty State */
        <div className="bg-dark-card border border-slate-800/40 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-5 shadow-xs glow-card">
          <div className="inline-flex p-4 bg-slate-900/40 text-text-secondary rounded-2xl border border-slate-800/40">
            <Inbox className="h-10 w-10 text-primary/70" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-text-primary">No Study Notes Found</h3>
            <p className="text-sm text-text-secondary">
              {searchQuery || selectedSubject !== 'All' 
                ? "No uploaded files match your active filters or query. Try refining your parameters."
                : "You haven't uploaded any study notes yet. Upload your first PDF to begin your AI journey!"}
            </p>
          </div>
          {!searchQuery && selectedSubject === 'All' && (
            <button
              onClick={() => navigate('/notes/upload')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neon-gradient hover:opacity-95 text-white rounded-xl font-semibold text-sm transition-all active:scale-97 cursor-pointer glow-button"
            >
              <Plus className="h-4 w-4" />
              Upload Now
            </button>
          )}
        </div>
      ) : (
        /* Notes Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div 
              key={note.id}
              className="bg-dark-card border border-slate-800/40 rounded-2xl overflow-hidden shadow-xs hover:translate-y-[-2px] transition-all duration-300 flex flex-col justify-between glow-card"
            >
              {/* Card Main Body */}
              <div className="p-5 space-y-4">
                {/* Topic / File Indicator */}
                <div className="flex justify-between items-start gap-2">
                  <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border ${getSubjectColor(note.subject)}`}>
                    {note.subject}
                  </span>
                  <div className="p-1.5 bg-error/10 text-error rounded-lg shrink-0">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h4 className="font-display font-bold text-text-primary text-base line-clamp-2 leading-snug" title={note.title}>
                    {note.title}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1 truncate" title={note.filename}>
                    {note.filename}
                  </p>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="px-5 py-4 bg-slate-900/20 border-t border-slate-800/40 flex flex-col space-y-3">
                <div className="flex justify-between items-center text-[11px] text-text-secondary font-semibold">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>{formatDate(note.upload_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                    <span>{formatBytes(note.filesize)}</span>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleDownload(note.id, note.filename)}
                    className="flex items-center justify-center gap-1 px-3 py-2 border border-slate-800 hover:bg-slate-800 text-text-primary rounded-xl text-xs font-bold transition-all active:scale-97 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-primary" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    disabled={deletingId === note.id}
                    className="flex items-center justify-center gap-1 px-3 py-2 border border-error/10 hover:bg-error/10 text-error rounded-xl text-xs font-bold transition-all active:scale-97 cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === note.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default NotesList;

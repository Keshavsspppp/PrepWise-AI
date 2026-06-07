import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Sparkles } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import API from '../api/axios';

const UploadNotes = () => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('DSA');
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const subjects = ['DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Aptitude', 'Other'];

  const validateFile = (selectedFile) => {
    setError('');
    setSuccess('');
    
    if (!selectedFile) return false;
    
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed.');
      return false;
    }
    
    const maxSize = 20 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`File is too large. Maximum allowed size is 20MB. Selected file: ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`);
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      if (!title) {
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(cleanName);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        if (!title) {
          const cleanName = droppedFile.name.replace(/\.[^/.]+$/, "");
          setTitle(cleanName);
        }
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Please provide a title for the study notes.');
      return;
    }

    if (!file) {
      setError('Please select or drop a PDF file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);

    try {
      await API.post('/notes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setSuccess('Study notes uploaded and indexed successfully!');
      setTitle('');
      setFile(null);
      setTimeout(() => {
        navigate('/notes/list');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout currentPage="Upload Notes">
      <div className="max-w-3xl mx-auto">
        <div className="bg-dark-card border border-slate-800/40 rounded-3xl shadow-xl shadow-black/30 overflow-hidden glow-card">
          {/* Header Banner */}
          <div className="bg-neon-gradient px-8 py-6 text-white relative">
            <div className="absolute right-0 top-0 h-full w-32 bg-white/5 blur-xl pointer-events-none"></div>
            <h2 className="font-display font-bold text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning animate-pulse" />
              Upload Study Notes
            </h2>
            <p className="text-white/80 text-xs mt-1">
              Add your notes in PDF format. StudyGenie will store your document, extract the metadata, and make it available for indexing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-xs text-success flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Document Title Input */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Introduction to Dynamic Programming"
                  className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-sm focus:outline-hidden focus:border-primary focus:bg-slate-900/85 transition-all duration-200 text-text-primary"
                />
              </div>

              {/* Subject Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Subject Category
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-sm focus:outline-hidden focus:border-primary focus:bg-slate-900/85 transition-all duration-200 text-text-primary"
                >
                  {subjects.map((sub) => (
                    <option key={sub} value={sub} className="bg-dark-card text-text-primary">{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                PDF Document
              </label>
              
              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`
                    border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px]
                    ${dragActive 
                      ? 'border-primary bg-primary/10' 
                      : 'border-slate-800 hover:border-primary hover:bg-slate-900/20'}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="p-4 bg-primary/10 text-primary rounded-2xl mb-4">
                    <Upload className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    Drag and drop your PDF here, or <span className="text-primary hover:underline">browse files</span>
                  </p>
                  <p className="text-xs text-text-secondary mt-2">
                    PDF format only (Max 20MB)
                  </p>
                </div>
              ) : (
                /* Selected File Preview */
                <div className="p-4 border border-slate-850 rounded-2xl bg-slate-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 bg-error/10 text-error rounded-xl">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{file.name}</p>
                      <p className="text-xs text-text-secondary">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  
                  {!uploading && (
                    <button 
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 text-text-secondary hover:text-error hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-text-secondary flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                    Uploading to storage...
                  </span>
                  <span className="font-bold text-primary">{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-neon-gradient rounded-full transition-all duration-100" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Actions Button */}
            <div className="pt-4 border-t border-slate-800/40 flex justify-end gap-3.5">
              <button
                type="button"
                disabled={uploading}
                onClick={() => navigate('/notes/list')}
                className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-800 text-text-secondary text-sm font-semibold transition-all active:scale-97 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2.5 rounded-xl bg-neon-gradient hover:opacity-95 text-white font-semibold text-sm transition-all shadow-md shadow-primary/10 active:scale-97 cursor-pointer disabled:opacity-50 glow-button"
              >
                {uploading ? 'Uploading...' : 'Upload Notes'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UploadNotes;

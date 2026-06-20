import React, { useState } from 'react';
import {
  BookOpen, LayoutDashboard, BrainCircuit, Calendar,
  Mic, LogOut, Menu, Bell, Sparkles, Dna, RefreshCcw,
  GraduationCap, X, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const nav = [
  { name: 'Dashboard',          icon: LayoutDashboard, href: '#/dashboard',    pages: ['Dashboard'] },
  { name: 'Notes Manager',      icon: BookOpen,         href: '#/notes/list',   pages: ['Notes Manager', 'Upload Notes'] },
  { name: 'AI Study Assistant', icon: BrainCircuit,     href: '#/ai/ask',       pages: ['AI Study Assistant'] },
  { name: 'AI Quiz Planner',    icon: Calendar,         href: '#/quiz/history', pages: ['AI Quiz Planner','Quiz Generator','Quiz Attempt','Quiz Results'] },
  { name: 'Mastery & Insights', icon: Dna,              href: '#/dna',          pages: ['Mastery & Insights', 'Learning DNA', 'Smart Revision', 'Revision History', 'Exam Readiness'] },
  { name: 'AI Mock Viva',       icon: Mic,              href: '#/viva',         pages: ['AI Mock Viva','Viva Session','Viva Results','Viva History'] },
];

const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

const NavLink = ({ item, current }) => {
  const Icon = item.icon;
  const active = item.pages.includes(current);
  return (
    <a href={item.href} className={`nav-link${active ? ' active' : ''}`}>
      <span className="nav-icon"><Icon size={15} /></span>
      {item.name}
      {active && <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'var(--amber)' }} />}
    </a>
  );
};

const DashboardLayout = ({ children, currentPage = 'Dashboard' }) => {
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', fontFamily: 'var(--font-body)', position: 'relative', overflow: 'hidden' }}>

      {/* Decorative Background Orbs */}
      <div className="glow-orb glow-orb-primary" />
      <div className="glow-orb glow-orb-secondary" />

      {/* Overlay */}
      <div
        className={`sidebar-overlay${open ? ' show' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '1.125rem 1rem', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: '2rem', height: '2rem', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--amber), #e07b09)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Sparkles size={14} color="#0a0a0f" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>PrepWise</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', fontWeight: 500 }}>AI STUDY</div>
          </div>
          <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }} className="lg:hidden">
            <X size={15} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0.125rem', overflowY: 'auto' }}>
          <p className="label" style={{ padding: '0.5rem 0.75rem 0.375rem' }}>Navigation</p>
          {nav.map(item => <NavLink key={item.name} item={item} current={currentPage} />)}
        </nav>

        {/* User footer */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)',
              background: 'var(--amber-dim)', border: '1px solid var(--amber-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.7rem', color: 'var(--amber)',
              flexShrink: 0,
            }}>
              {initials(user?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Student'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Header */}
        <header className="app-header">
          <button
            onClick={() => setOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginRight: '0.5rem', padding: '0.25rem' }}
            className="lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{currentPage}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {/* Live status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', background: 'var(--teal-dim)', border: '1px solid var(--teal-border)', borderRadius: '100px', fontSize: '0.7rem', color: 'var(--teal)', fontWeight: 600 }}>
              <span className="dot-live" style={{ animation: 'pulse-glow 2s infinite' }} />
              Gemini
            </div>

            {/* Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setBell(!bell)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.375rem', display: 'flex', alignItems: 'center', transition: 'all var(--transition)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <Bell size={15} />
                <span style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--amber)' }} />
              </button>

              {bell && (
                <div className="animate-fade-in" style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: '18rem', background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 60,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem' }}>Notifications</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--amber)', fontWeight: 600 }}>Mark read</button>
                  </div>
                  {[
                    { icon: '📉', t: 'Forgetting Curve Alert', m: '"Dynamic Programming" retention dropped below 50%' },
                    { icon: '📅', t: 'Revision Due', m: 'OS Scheduling revision is overdue today' },
                  ].map((n, i) => (
                    <div key={i} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'all var(--transition)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <div style={{ display: 'flex', gap: '0.625rem' }}>
                        <span style={{ fontSize: '1rem' }}>{n.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{n.t}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{n.m}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Avatar */}
            <div style={{
              width: '1.875rem', height: '1.875rem', borderRadius: 'var(--radius-sm)',
              background: 'var(--amber-dim)', border: '1px solid var(--amber-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.6875rem', color: 'var(--amber)',
              cursor: 'default',
            }}>
              {initials(user?.name)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <div className="animate-fade-up" style={{ maxWidth: '72rem', margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

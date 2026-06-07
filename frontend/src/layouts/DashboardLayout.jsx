import React, { useState } from 'react';
import { 
  BookOpen, 
  LayoutDashboard, 
  BrainCircuit, 
  Calendar, 
  Mic, 
  BarChart3, 
  LogOut, 
  Menu, 
  Bell, 
  User,
  Sparkles,
  Dna,
  RefreshCcw,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ children, currentPage = 'Dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, logout } = useAuth();

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '#/dashboard', active: currentPage === 'Dashboard' },
    { name: 'Notes Manager', icon: BookOpen, href: '#/notes/list', active: currentPage === 'Notes Manager' },
    { name: 'AI Study Assistant', icon: BrainCircuit, href: '#/ai/ask', active: currentPage === 'AI Study Assistant' },
    { name: 'AI Quiz Planner', icon: Calendar, href: '#/quiz/history', active: currentPage === 'AI Quiz Planner' || currentPage === 'Quiz Generator' || currentPage === 'Quiz Attempt' || currentPage === 'Quiz Results' },
    { name: 'Learning DNA', icon: Dna, href: '#/dna', active: currentPage === 'Learning DNA' },
    { name: 'Smart Revision', icon: RefreshCcw, href: '#/revision', active: currentPage === 'Smart Revision' || currentPage === 'Revision History' },
    { name: 'Exam Readiness', icon: GraduationCap, href: '#/readiness', active: currentPage === 'Exam Readiness' },
    { name: 'AI Mock Viva', icon: Mic, href: '#/viva', active: currentPage === 'AI Mock Viva' || currentPage === 'Viva Session' || currentPage === 'Viva Results' || currentPage === 'Viva History' },
    { name: 'Analytics', icon: BarChart3, href: '#', active: currentPage === 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col font-sans text-text-primary">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-dark-bg/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-dark-card border-r border-slate-800/40
        transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-800/40">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-neon-gradient text-white shadow-md shadow-primary/20">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-neon-gradient">
            StudyGenie AI
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3.5 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                  ${item.active 
                    ? 'bg-slate-800/50 text-white font-semibold shadow-xs border-l-4 border-primary' 
                    : 'text-text-secondary hover:bg-slate-800/30 hover:text-white'}
                `}
              >
                <Icon className={`
                  h-5 w-5 transition-transform duration-200 group-hover:scale-110
                  ${item.active ? 'text-primary' : 'text-slate-550 group-hover:text-slate-405'}
                `} />
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800/50 bg-slate-900/20">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 text-text-primary font-bold text-xs uppercase shadow-inner">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{user?.name || 'Alex Student'}</p>
              <p className="text-xs text-text-secondary truncate">{user?.email || 'alex@studygenie.ai'}</p>
            </div>
            <button 
              onClick={logout}
              title="Sign Out"
              className="text-text-secondary hover:text-error transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="lg:pl-72 flex flex-col flex-1">
        {/* Header/Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/30 bg-dark-card/85 backdrop-blur-md px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-text-secondary hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display font-bold text-lg md:text-xl text-text-primary">
              {currentPage}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stats Panel */}
            <div className="hidden sm:flex items-center gap-2 bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20 text-primary text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Readiness: 78%</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-text-secondary hover:bg-slate-800 rounded-lg transition-colors relative cursor-pointer"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-error"></span>
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-80 rounded-2xl bg-dark-card border border-slate-800 shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-4 pb-2 border-b border-slate-800/50 flex justify-between items-center">
                    <span className="font-semibold text-sm text-text-primary">Notifications</span>
                    <button className="text-xs text-primary hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1.5">
                    <div className="px-4 py-2.5 hover:bg-slate-850 transition-colors">
                      <p className="text-xs font-medium text-text-primary">Forgetting Curve Alert 📉</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">Your retention for "Dynamic Programming" has dropped below 50%. Schedule a revision quiz!</p>
                    </div>
                    <div className="px-4 py-2.5 hover:bg-slate-850 transition-colors border-t border-slate-800/40">
                      <p className="text-xs font-medium text-text-primary">New study plan generated 📅</p>
                      <p className="text-[11px] text-text-secondary mt-0.5">We updated your calendar according to your upcoming DBMS exam.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown Toggle */}
            <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
            <button className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded-xl transition-colors">
              <div className="h-8 w-8 rounded-lg bg-neon-gradient text-white flex items-center justify-center font-bold text-sm uppercase">
                {getInitials(user?.name)}
              </div>
            </button>
          </div>
        </header>

        {/* Children/Main Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

import React from 'react';
import { 
  FileText, 
  Clock, 
  Award, 
  ShieldAlert, 
  ArrowUpRight, 
  Brain,
  History,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const Dashboard = () => {
  const stats = [
    { 
      name: 'Notes Uploaded', 
      value: '12 Files', 
      change: '+3 this week', 
      icon: FileText, 
      color: 'from-blue-500 to-indigo-500', 
      bg: 'bg-primary/10' 
    },
    { 
      name: 'Study Hours', 
      value: '34.5 Hrs', 
      change: '1.2h today', 
      icon: Clock, 
      color: 'from-brand-500 to-purple-600', 
      bg: 'bg-secondary/10' 
    },
    { 
      name: 'Quiz Accuracy', 
      value: '76%', 
      change: '+4% vs last week', 
      icon: Award, 
      color: 'from-emerald-400 to-teal-500', 
      bg: 'bg-success/10' 
    },
    { 
      name: 'Ready Score', 
      value: '78%', 
      change: 'Target: 85%', 
      icon: TrendingUp, 
      color: 'from-amber-400 to-orange-500', 
      bg: 'bg-warning/10' 
    },
  ];

  const weakTopics = [
    { name: 'Dynamic Programming', percentage: 42, color: 'bg-error', retention: 'Critical (Forget curve)' },
    { name: 'Operating Systems', percentage: 75, color: 'bg-warning', retention: 'Fair (Review in 2 days)' },
  ];

  const strongTopics = [
    { name: 'DBMS Indexing', percentage: 92, color: 'bg-success' },
    { name: 'Computer Networks', percentage: 88, color: 'bg-success' },
  ];

  return (
    <DashboardLayout currentPage="Dashboard">
      {/* Welcome Hero Panel */}
      <div className="relative overflow-hidden rounded-3xl bg-neon-gradient p-8 md:p-10 text-white shadow-xl shadow-primary/10">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 -mb-12 h-36 w-36 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-warning" />
            <span>StudyGenie Intelligence v1.0</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight">
            Welcome back, Alex!
          </h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Your retention engine predicts you are ready to study. You have 2 key topics in "Dynamic Programming" that require revision today to beat the forgetting curve.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button className="bg-white hover:bg-text-primary text-primary px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md active:scale-95 cursor-pointer glow-button">
              Start Practice Quiz
            </button>
            <button className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer">
              Upload New Notes
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name} 
              className="bg-dark-card border border-slate-800/40 p-6 rounded-2xl shadow-xs transition-all duration-355 glow-card"
            >
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                  Real-time
                </span>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="text-2xl font-bold text-text-primary tracking-tight">{stat.value}</h3>
                <p className="text-sm font-medium text-text-secondary">{stat.name}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs">
                <span className="text-text-secondary font-medium">{stat.change}</span>
                <a href="#" className="text-primary hover:underline flex items-center gap-0.5 font-semibold">
                  View <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Learning DNA & Forgetting Curve Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Learning DNA Profile */}
        <div className="lg:col-span-2 bg-dark-card border border-slate-800/40 rounded-2xl p-6 shadow-xs flex flex-col space-y-6 glow-card">
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-secondary/15 text-secondary rounded-lg">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-text-primary">Learning DNA Profile</h3>
                <p className="text-xs text-text-secondary">Subject mastery and performance trends</p>
              </div>
            </div>
            <span className="bg-secondary/15 text-secondary text-xs px-2.5 py-1 rounded-full font-semibold border border-secondary/10">
              Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weak Areas (Focus Required) */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-error flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-error"></span>
                Focus Needed (Weak Areas)
              </h4>
              <div className="space-y-3.5">
                {weakTopics.map((topic) => (
                  <div key={topic.name} className="space-y-1.5 p-3 rounded-xl bg-slate-900/30 border border-slate-800/30">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-text-primary">{topic.name}</span>
                      <span className="font-bold text-error">{topic.percentage}% Mastery</span>
                    </div>
                    <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                      <div className={`h-full ${topic.color}`} style={{ width: `${topic.percentage}%` }}></div>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1">{topic.retention}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strong Areas (Mastered) */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider font-bold text-success flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                Mastered Topics (Strengths)
              </h4>
              <div className="space-y-3.5">
                {strongTopics.map((topic) => (
                  <div key={topic.name} className="space-y-1.5 p-3 rounded-xl bg-slate-900/30 border border-slate-800/30">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-text-primary">{topic.name}</span>
                      <span className="font-bold text-success">{topic.percentage}% Mastery</span>
                    </div>
                    <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                      <div className={`h-full ${topic.color}`} style={{ width: `${topic.percentage}%` }}></div>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-1">Consistency is key - review in 2 weeks</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Forgetting Curve Engine */}
        <div className="bg-dark-card border border-slate-800/40 rounded-2xl p-6 shadow-xs flex flex-col space-y-6 glow-card">
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-warning/15 text-warning rounded-lg">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-text-primary">Forgetting Curve</h3>
                <p className="text-xs text-text-secondary">Next planned revisions</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="p-4 rounded-2xl bg-warning/10 border border-warning/20 text-xs text-warning flex gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>We suggest doing a retrieval practice today for <strong>Dynamic Programming</strong> to reset memory decay.</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-800/40">
                <div>
                  <p className="font-semibold text-text-primary">Dynamic Programming</p>
                  <p className="text-[10px] text-error mt-0.5">Retention: 42% (Critical)</p>
                </div>
                <button className="bg-error hover:bg-error/90 text-white font-semibold px-3 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer">
                  Revise Now
                </button>
              </div>

              <div className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-800/40">
                <div>
                  <p className="font-semibold text-text-primary">Operating Systems</p>
                  <p className="text-[10px] text-warning mt-0.5">Retention: 75% (Medium)</p>
                </div>
                <button className="bg-warning hover:bg-warning/90 text-white font-semibold px-3 py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer">
                  Schedule
                </button>
              </div>

              <div className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-800/40 opacity-50">
                <div>
                  <p className="font-semibold text-text-primary">DBMS Indexing</p>
                  <p className="text-[10px] text-success mt-0.5">Retention: 92% (Excellent)</p>
                </div>
                <button disabled className="bg-slate-800 text-slate-500 font-semibold px-3 py-1.5 rounded-lg text-[10px]">
                  Solid
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Activity Section */}
      <div className="bg-dark-card border border-slate-800/40 rounded-2xl p-6 shadow-xs flex flex-col space-y-6 glow-card">
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-800 text-text-secondary rounded-lg">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-text-primary">Recent Activity</h3>
              <p className="text-xs text-text-secondary">Your latest StudyGenie learning sessions</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-800/40">
          <div className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-success/10 text-success flex items-center justify-center font-bold text-xs">
                Q
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Completed Quiz: DBMS Transactions</p>
                <p className="text-xs text-text-secondary">10 Questions • Easy Difficulty</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-text-primary">90% Score</p>
              <p className="text-[10px] text-text-secondary">2 hours ago</p>
            </div>
          </div>

          <div className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                N
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Uploaded Study Notes: CN_Routing_Algorithms.pdf</p>
                <p className="text-xs text-text-secondary">Computer Networks • 45 Pages • 4.2MB</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-text-secondary">Processed</p>
              <p className="text-[10px] text-text-secondary">Yesterday</p>
            </div>
          </div>

          <div className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
                V
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Completed AI Mock Viva: Operating Systems</p>
                <p className="text-xs text-text-secondary">Conducted evaluation for process synchronization</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-text-primary">75% Score</p>
              <p className="text-[10px] text-text-secondary">3 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

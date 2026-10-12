import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TeamProvider, useTeam } from '../context/TeamContext';
import { StandupProvider } from '../context/StandupContext';
import { SocketProvider, useSocket } from '../context/SocketContext';
import { TaskProvider } from '../context/TaskContext';
import { TeamManagementCard } from '../components/TeamManagementCard';
import { StandupFormCard } from '../components/StandupFormCard';
import { StandupFeed } from '../components/StandupFeed';
import { KanbanBoard } from '../components/KanbanBoard';
import { LogOut, User as UserIcon, Sparkles, Wifi, MessageSquare, Kanban } from 'lucide-react';

export const DashboardPageContent: React.FC = () => {
  const { user, logout } = useAuth();
  const { team } = useTeam();
  const { isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState<'standups' | 'kanban'>('standups');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-lg">
              S
            </div>
            <span className="font-bold text-lg text-white tracking-tight">StandupAI</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live Socket Status Indicator */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              <Wifi className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse' : ''}`} />
              <span>{isConnected ? 'Live Sync' : 'Offline'}</span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <UserIcon className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-medium text-white">{user?.name}</span>
              <span className="text-slate-500">({user?.role})</span>
            </div>

            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Dashboard & Workspace
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Post daily standups, track AI-extracted tasks, and organize team workflow.
            </p>
          </div>

          {/* View Switcher Tabs (Only if in a team) */}
          {team && (
            <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
              <button
                onClick={() => setActiveTab('standups')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'standups'
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Standups Feed</span>
              </button>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'kanban'
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Kanban className="w-4 h-4" />
                <span>Kanban Board</span>
              </button>
            </div>
          )}
        </header>

        {/* Feature 2: Team Management Section */}
        <section>
          <TeamManagementCard />
        </section>

        {/* Feature 3, 4, 5 & 6: Active Team Workspace */}
        {team && (
          <StandupProvider>
            <TaskProvider>
              {activeTab === 'standups' ? (
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Post/Update Standup Form */}
                  <div className="lg:col-span-5">
                    <StandupFormCard />
                  </div>

                  {/* Right Column: Live Team Feed */}
                  <div className="lg:col-span-7">
                    <StandupFeed />
                  </div>
                </section>
              ) : (
                <section>
                  <KanbanBoard />
                </section>
              )}
            </TaskProvider>
          </StandupProvider>
        )}

      
            <Sparkles className="w-4 h-4" />
          
      </main>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  return (
    <SocketProvider>
      <TeamProvider>
        <DashboardPageContent />
      </TeamProvider>
    </SocketProvider>
  );
};

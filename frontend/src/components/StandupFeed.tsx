import React from 'react';
import { useStandup } from '../context/StandupContext';
import { Calendar, AlertOctagon, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { StandupTaskBadges } from './StandupTaskBadges';

export const StandupFeed: React.FC = () => {
  const { standups, loading, selectedDate, setSelectedDate } = useStandup();

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Team Standups Feed</h2>
            <p className="text-xs text-slate-400">Live feed of standups posted by your team members</p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800 px-3.5 py-2 rounded-2xl text-xs">
          <Calendar className="w-4 h-4 text-brand-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-white focus:outline-none font-mono cursor-pointer"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : standups.length === 0 ? (
        <div className="py-12 text-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No standups posted yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Be the first team member to post a daily standup for {selectedDate}!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {standups.map((standup) => {
            const u = typeof standup.userId === 'object' ? standup.userId : null;
            const name = u?.name || 'Team Member';
            const email = u?.email || '';
            const role = u?.role || 'member';
            const hasBlockers = standup.blockers && standup.blockers.toLowerCase() !== 'none' && standup.blockers.trim() !== '';

            return (
              <div
                key={standup._id}
                className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4"
              >
                {/* User Info Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center font-bold text-brand-300 text-sm">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">{name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 uppercase">
                          {role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{email}</div>
                    </div>
                  </div>

                  {/* Blocker Indicator Badge */}
                  {hasBlockers ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 space-x-1.5 animate-pulse">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>Has Blockers</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>On Track</span>
                    </span>
                  )}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                  {/* Did */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-1.5">
                    <div className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>Accomplished (Did)</span>
                    </div>
                    <p className="text-slate-200 whitespace-pre-line leading-relaxed font-sans">{standup.did}</p>
                  </div>

                  {/* Doing */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-1.5">
                    <div className="font-semibold text-brand-400 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                      <span>Planned (Doing)</span>
                    </div>
                    <p className="text-slate-200 whitespace-pre-line leading-relaxed font-sans">{standup.doing}</p>
                  </div>

                  {/* Blockers */}
                  <div
                    className={`p-4 rounded-xl border space-y-1.5 ${
                      hasBlockers
                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-200'
                        : 'bg-slate-900/60 border-slate-800/60 text-slate-400'
                    }`}
                  >
                    <div
                      className={`font-semibold uppercase tracking-wider text-[10px] flex items-center space-x-1 ${
                        hasBlockers ? 'text-rose-400' : 'text-slate-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${hasBlockers ? 'bg-rose-400' : 'bg-slate-500'}`}></span>
                      <span>Blockers</span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed font-sans">
                      {standup.blockers || 'None'}
                    </p>
                  </div>
                </div>

                {/* AI Extracted Tasks Badges */}
                <StandupTaskBadges tasks={standup.tasks} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

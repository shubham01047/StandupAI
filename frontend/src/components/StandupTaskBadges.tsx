import React from 'react';
import { Task } from '../types/task';
import { Sparkles, CheckCircle2, Clock, AlertOctagon, Circle } from 'lucide-react';

interface StandupTaskBadgesProps {
  tasks?: Task[];
}

export const StandupTaskBadges: React.FC<StandupTaskBadgesProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="pt-3 mt-3 border-t border-slate-800/80">
      <div className="flex items-center space-x-1.5 text-xs font-semibold text-brand-400 mb-2.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="text-[11px] uppercase tracking-wider">AI Extracted Action Items ({tasks.length})</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {tasks.map((task) => {
          let statusBadgeClass = 'bg-slate-800/80 text-slate-300 border-slate-700';
          let StatusIcon = Circle;

          if (task.status === 'done') {
            statusBadgeClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
            StatusIcon = CheckCircle2;
          } else if (task.status === 'in-progress') {
            statusBadgeClass = 'bg-brand-500/10 text-brand-300 border-brand-500/30';
            StatusIcon = Clock;
          } else if (task.status === 'blocked') {
            statusBadgeClass = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
            StatusIcon = AlertOctagon;
          }

          return (
            <div
              key={task._id}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium ${statusBadgeClass}`}
            >
              <StatusIcon className="w-3 h-3 flex-shrink-0" />
              <span>{task.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

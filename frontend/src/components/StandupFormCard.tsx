import React, { useState, useEffect } from 'react';
import { useStandup } from '../context/StandupContext';
import { useAuth } from '../context/AuthContext';
import { Send, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export const StandupFormCard: React.FC = () => {
  const { submitStandup, standups } = useStandup();
  const { user } = useAuth();

  const [did, setDid] = useState('');
  const [doing, setDoing] = useState('');
  const [blockers, setBlockers] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if current user already submitted a standup today
  const existingStandup = standups.find((s) => {
    const userId = typeof s.userId === 'object' ? s.userId._id : s.userId;
    return userId === user?.id;
  });

  useEffect(() => {
    if (existingStandup) {
      setDid(existingStandup.did);
      setDoing(existingStandup.doing);
      setBlockers(existingStandup.blockers || '');
    }
  }, [existingStandup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!did.trim() || !doing.trim()) {
      setError('Please fill in both what you did and what you are doing today.');
      return;
    }

    try {
      setSubmitting(true);
      await submitStandup({
        did: did.trim(),
        doing: doing.trim(),
        blockers: blockers.trim() || 'None',
      });
      setSuccessMessage(existingStandup ? 'Standup updated successfully! 🚀' : 'Daily standup submitted! 🚀');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit standup.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulletKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    value: string,
    setValue: (val: string) => void
  ) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: Allow normal line break without bullet point
        return;
      }

      // Enter: Prevent default newline and insert new bullet point
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const insertion = '\n• ';
      const newValue = value.substring(0, start) + insertion + value.substring(end);
      setValue(newValue);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + insertion.length;
      }, 0);
    }
  };

  const handleFocus = (value: string, setValue: (val: string) => void) => {
    if (!value.trim()) {
      setValue('• ');
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {existingStandup ? 'Update Today\'s Standup' : 'Post Daily Standup'}
            </h2>
            <p className="text-xs text-slate-400">Share your progress & blockers with your team</p>
          </div>
        </div>

        {existingStandup && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Submitted for Today</span>
          </span>
        )}
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-3 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Field 1: Did */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>What did you accomplish yesterday / today?</span>
            </span>
            <span className="text-[10px] text-slate-500 lowercase font-normal">Enter = • bullet | Shift+Enter = line</span>
          </label>
          <textarea
            rows={3}
            required
            value={did}
            onChange={(e) => setDid(e.target.value)}
            onKeyDown={(e) => handleBulletKeyDown(e, did, setDid)}
            onFocus={() => handleFocus(did, setDid)}
            placeholder="• Completed JWT refresh token backend logic&#10;• Reviewed PR #42 for database indexing"
            className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all resize-none font-sans"
          />
        </div>

        {/* Field 2: Doing */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-400 mb-2 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-400"></span>
              <span>What are you planning to do today?</span>
            </span>
            <span className="text-[10px] text-slate-500 lowercase font-normal">Enter = • bullet | Shift+Enter = line</span>
          </label>
          <textarea
            rows={3}
            required
            value={doing}
            onChange={(e) => setDoing(e.target.value)}
            onKeyDown={(e) => handleBulletKeyDown(e, doing, setDoing)}
            onFocus={() => handleFocus(doing, setDoing)}
            placeholder="• Implement AI task extraction pipeline&#10;• Wire Socket.IO real-time standup feed"
            className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all resize-none font-sans"
          />
        </div>

        {/* Field 3: Blockers */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-rose-400 mb-2 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Any blockers or impediments? (Optional)</span>
            </span>
            <span className="text-[10px] text-slate-500 lowercase font-normal">Enter = • bullet | Shift+Enter = line</span>
          </label>
          <textarea
            rows={2}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            onKeyDown={(e) => handleBulletKeyDown(e, blockers, setBlockers)}
            onFocus={() => handleFocus(blockers, setBlockers)}
            placeholder="• Waiting for API key approval for OpenAI production model"
            className="w-full px-4 py-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all resize-none font-sans"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="py-3.5 px-6 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-2xl shadow-lg shadow-brand-600/25 transition-all text-sm flex items-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving standup...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{existingStandup ? 'Update Standup' : 'Submit Standup'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

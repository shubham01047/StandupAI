import React, { useState } from 'react';
import { useTeam } from '../context/TeamContext';
import { Users, Copy, Check, PlusCircle, LogIn as JoinIcon, LogOut, Shield, Mail, AlertCircle } from 'lucide-react';

export const TeamManagementCard: React.FC = () => {
  const { team, loading, createTeam, joinTeam, leaveTeam } = useTeam();

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    try {
      setSubmitting(true);
      await createTeam({ name: teamName.trim() });
      setTeamName('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create team.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    try {
      setSubmitting(true);
      await joinTeam({ inviteCode: inviteCode.trim() });
      setInviteCode('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to join team. Please check the code.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (window.confirm('Are you sure you want to leave this team?')) {
      try {
        await leaveTeam();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Error leaving team');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // State 1: User belongs to a Team
  if (team) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-2xl font-bold text-white tracking-tight">{team.name}</span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Active Team
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              {team.members.length} {team.members.length === 1 ? 'member' : 'members'} collaborating
            </p>
          </div>

          {/* Invite Code Box */}
          <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Team Invite Code</div>
              <div className="text-sm font-mono font-bold text-brand-400 tracking-wider">{team.inviteCode}</div>
            </div>
            <button
              onClick={handleCopyInviteCode}
              title="Copy invite code"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Members Section */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
            <Users className="w-4 h-4 text-brand-400" />
            <span>Team Members</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {team.members.map((member, idx) => {
              const u = typeof member.userId === 'object' ? member.userId : null;
              const name = u?.name || 'Team Member';
              const email = u?.email || '';
              const isLead = member.role === 'lead';

              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white truncate">{name}</span>
                      {isLead && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Shield className="w-2.5 h-2.5 mr-0.5" /> Lead
                        </span>
                      )}
                    </div>
                    {email && (
                      <div className="text-xs text-slate-500 truncate flex items-center space-x-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span>{email}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={handleLeaveTeam}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Team</span>
          </button>
        </div>
      </div>
    );
  }

  // State 2: User has no Team assigned yet
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      <div className="text-center max-w-md mx-auto mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
          <Users className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Join or Create a Team</h2>
        <p className="text-slate-400 text-sm mt-1">
          To track standups and parse tasks with AI, connect with your engineering team.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 max-w-md mx-auto mb-6">
        <button
          onClick={() => { setActiveTab('create'); setError(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'create'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Team</span>
        </button>
        <button
          onClick={() => { setActiveTab('join'); setError(null); }}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'join'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <JoinIcon className="w-4 h-4" />
          <span>Join via Code</span>
        </button>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Content 1: Create Team */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateSubmit} className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Team Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Core Engineering"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/25 transition-all text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating team...</span>
              </>
            ) : (
              <span>Create Team</span>
            )}
          </button>
        </form>
      )}

      {/* Tab Content 2: Join Team */}
      {activeTab === 'join' && (
        <form onSubmit={handleJoinSubmit} className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Team Invite Code
            </label>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. SAI-8X2P"
              className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono tracking-wider text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/25 transition-all text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Joining team...</span>
              </>
            ) : (
              <span>Join Team</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

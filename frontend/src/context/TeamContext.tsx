import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Team, CreateTeamPayload, JoinTeamPayload } from '../types/team';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface TeamContextType {
  team: Team | null;
  loading: boolean;
  createTeam: (payload: CreateTeamPayload) => Promise<void>;
  joinTeam: (payload: JoinTeamPayload) => Promise<void>;
  leaveTeam: () => Promise<void>;
  refreshTeam: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const fetchMyTeam = useCallback(async () => {
    if (!user) {
      setTeam(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get<{ team: Team | null }>('/teams/my-team');
      setTeam(res.data.team);
    } catch (err) {
      console.error('[TeamContext] Error fetching team details:', err);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyTeam();
  }, [fetchMyTeam]);

  const createTeam = async (payload: CreateTeamPayload): Promise<void> => {
    const res = await api.post<{ team: Team }>('/teams/create', payload);
    setTeam(res.data.team);
    await fetchMyTeam();
  };

  const joinTeam = async (payload: JoinTeamPayload): Promise<void> => {
    const res = await api.post<{ team: Team }>('/teams/join', payload);
    setTeam(res.data.team);
    await fetchMyTeam();
  };

  const leaveTeam = async (): Promise<void> => {
    await api.post('/teams/leave');
    setTeam(null);
  };

  return (
    <TeamContext.Provider value={{ team, loading, createTeam, joinTeam, leaveTeam, refreshTeam: fetchMyTeam }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = (): TeamContextType => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

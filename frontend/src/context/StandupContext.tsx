import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Standup, CreateStandupPayload } from '../types/standup';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface StandupContextType {
  standups: Standup[];
  loading: boolean;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  submitStandup: (payload: CreateStandupPayload) => Promise<void>;
  fetchTeamStandups: (date?: string) => Promise<void>;
}

const StandupContext = createContext<StandupContextType | undefined>(undefined);

export const StandupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [standups, setStandups] = useState<Standup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const fetchTeamStandups = useCallback(async (date?: string) => {
    if (!user || !user.teamId) {
      setStandups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const targetDate = date || selectedDate;
      const res = await api.get<{ standups: Standup[] }>(`/standups/team?date=${targetDate}`);
      setStandups(res.data.standups);
    } catch (err) {
      console.error('[StandupContext] Error fetching team standups:', err);
      setStandups([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    fetchTeamStandups(selectedDate);
  }, [fetchTeamStandups, selectedDate]);

  // Real-time socket event listeners for live standups and tasks
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleStandupEvent = (incomingStandup: Standup) => {
      console.log('[StandupContext] Real-time standup event received:', incomingStandup);

      // Only update feed if incoming standup matches current date view
      if (incomingStandup.dateStr === selectedDate) {
        setStandups((prev) => {
          const index = prev.findIndex((s) => s._id === incomingStandup._id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = incomingStandup;
            return updated;
          }
          return [incomingStandup, ...prev];
        });
      }
    };

    socket.on('standup:created_or_updated', handleStandupEvent);

    return () => {
      socket.off('standup:created_or_updated', handleStandupEvent);
    };
  }, [socket, isConnected, selectedDate]);

  const submitStandup = async (payload: CreateStandupPayload): Promise<void> => {
    await api.post('/standups', payload);
    await fetchTeamStandups(selectedDate);
  };

  return (
    <StandupContext.Provider
      value={{
        standups,
        loading,
        selectedDate,
        setSelectedDate,
        submitStandup,
        fetchTeamStandups,
      }}
    >
      {children}
    </StandupContext.Provider>
  );
};

export const useStandup = (): StandupContextType => {
  const context = useContext(StandupContext);
  if (!context) {
    throw new Error('useStandup must be used within a StandupProvider');
  }
  return context;
};

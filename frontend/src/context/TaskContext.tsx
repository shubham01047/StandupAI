import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Task, TaskStatus } from '../types/task';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  fetchTeamTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const fetchTeamTasks = useCallback(async () => {
    if (!user || !user.teamId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get<{ tasks: Task[] }>('/tasks/team');
      setTasks(res.data.tasks);
    } catch (err) {
      console.error('[TaskContext] Error fetching team tasks:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTeamTasks();
  }, [fetchTeamTasks]);

  // Real-time socket event listeners for live task updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTaskUpdated = (updatedTask: Task) => {
      console.log('[TaskContext] Real-time task update received:', updatedTask);
      setTasks((prev) => {
        const index = prev.findIndex((t) => t._id === updatedTask._id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = updatedTask;
          return updated;
        }
        return [updatedTask, ...prev];
      });
    };

    const handleStandupEvent = () => {
      // Re-fetch tasks when new standup AI extractions occur
      fetchTeamTasks();
    };

    socket.on('task:status_updated', handleTaskUpdated);
    socket.on('standup:created_or_updated', handleStandupEvent);

    return () => {
      socket.off('task:status_updated', handleTaskUpdated);
      socket.off('standup:created_or_updated', handleStandupEvent);
    };
  }, [socket, isConnected, fetchTeamTasks]);

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus): Promise<void> => {
    // Optimistic local state update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (err) {
      console.error('[TaskContext] Error updating task status:', err);
      // Revert on error
      await fetchTeamTasks();
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, updateTaskStatus, fetchTeamTasks }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

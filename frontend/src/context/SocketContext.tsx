import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log(`[SocketContext] Connected to real-time socket: ${socketInstance.id}`);
      setIsConnected(true);

      // Join team room if user has assigned teamId
      if (user?.teamId) {
        socketInstance.emit('join-team', { teamId: user.teamId });
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('[SocketContext] Disconnected from socket server');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      if (user?.teamId) {
        socketInstance.emit('leave-team', { teamId: user.teamId });
      }
      socketInstance.disconnect();
    };
  }, [user?.teamId]);

  // Re-emit join-team whenever teamId changes
  useEffect(() => {
    if (socket && isConnected && user?.teamId) {
      socket.emit('join-team', { teamId: user.teamId });
    }
  }, [socket, isConnected, user?.teamId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

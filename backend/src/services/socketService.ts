import { Server, Socket } from 'socket.io';

let ioInstance: Server | null = null;

/**
 * Initializes Socket.IO connection event listeners and room management
 */
export const initSocketService = (io: Server): void => {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join team room
    socket.on('join-team', ({ teamId }: { teamId: string }) => {
      if (teamId) {
        const roomName = `team:${teamId}`;
        socket.join(roomName);
        console.log(`[Socket.io] Socket ${socket.id} joined room: ${roomName}`);
      }
    });

    // Leave team room
    socket.on('leave-team', ({ teamId }: { teamId: string }) => {
      if (teamId) {
        const roomName = `team:${teamId}`;
        socket.leave(roomName);
        console.log(`[Socket.io] Socket ${socket.id} left room: ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Broadcasts a newly created or updated standup (and its AI tasks) to all members of a team
 */
export const broadcastStandupCreatedOrUpdated = (teamId: string, standupData: any): void => {
  if (ioInstance && teamId) {
    const roomName = `team:${teamId}`;
    ioInstance.to(roomName).emit('standup:created_or_updated', standupData);
    console.log(`[Socket.io] Broadcasted standup event to room ${roomName}`);
  }
};

/**
 * Broadcasts a task status update to all members of a team
 */
export const broadcastTaskUpdated = (teamId: string, taskData: any): void => {
  if (ioInstance && teamId) {
    const roomName = `team:${teamId}`;
    ioInstance.to(roomName).emit('task:status_updated', taskData);
    console.log(`[Socket.io] Broadcasted task status update to room ${roomName}`);
  }
};

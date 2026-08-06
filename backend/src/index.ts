import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import standupRoutes from './routes/standupRoutes';
import taskRoutes from './routes/taskRoutes';
import { initSocketService } from './services/socketService';

// Connect to MongoDB database
connectDB();

const app = express();
// HTTP server wrapping Express application to share single port with Socket.IO
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Socket.IO server initialization with CORS settings aligned with client origin
export const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// API Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/standups', standupRoutes);
app.use('/api/tasks', taskRoutes);

// Basic health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'StandupAI Backend API', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO real-time event handlers and room management
initSocketService(io);

server.listen(PORT, () => {
  console.log(`[StandupAI] Server listening on port ${PORT}`);
});

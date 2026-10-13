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
const rawOrigin = process.env.CLIENT_ORIGIN;
const corsOrigin = rawOrigin && rawOrigin !== '*' ? rawOrigin : true;

// Socket.IO server initialization with CORS settings aligned with client origin
export const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({ origin: corsOrigin, credentials: true }));
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

// AI provider diagnostic endpoint - tests Groq/OpenAI connection
app.get('/api/health/ai', async (_req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const activeKey = groqKey || openaiKey;
  const provider = groqKey ? 'Groq (Llama 3.1 8B)' : openaiKey ? 'OpenAI (gpt-4o-mini)' : 'None';

  if (!activeKey || activeKey.startsWith('your_')) {
    res.json({ status: 'unconfigured', provider: 'None', message: 'No API key set. Using rule-based fallback parser.' });
    return;
  }

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({
      apiKey: activeKey,
      baseURL: groqKey ? 'https://api.groq.com/openai/v1' : undefined,
    });
    const model = groqKey ? 'llama3-8b-8192' : 'gpt-4o-mini';
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Reply with JSON: {"ok": true}' }],
      temperature: 0,
      response_format: { type: 'json_object' },
      max_tokens: 20,
    });
    const reply = response.choices[0]?.message?.content;
    res.json({ status: 'connected', provider, model, reply });
  } catch (err: any) {
    res.status(500).json({ status: 'error', provider, message: err?.message || String(err) });
  }
});

// Initialize Socket.IO real-time event handlers and room management
initSocketService(io);

server.listen(PORT, () => {
  console.log(`[StandupAI] Server listening on port ${PORT}`);
});

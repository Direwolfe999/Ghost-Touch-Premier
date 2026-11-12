// server/index.js
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import { setupVitalsSockets } from './sockets/vitals.js';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// REST routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// HTTP server + Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Wire up vitals socket namespace
setupVitalsSockets(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Ghost-Touch backend listening on http://localhost:${PORT}`);
});

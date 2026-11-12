import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory session store (REST)
const sessions = new Map();

app.post('/api/sessions/create', (req, res) => {
  const { name, subject } = req.body || {};
  const sessionId = 'sess_' + Math.random().toString(36).slice(2, 10);
  const roomCode = 'GH-' + Math.floor(1000 + Math.random() * 9000);
  const startedAt = Date.now();
  sessions.set(sessionId, {
    sessionId,
    roomCode,
    name: name || 'Untitled session',
    subject: subject || 'General',
    startedAt,
    students: new Map(),
    vitalsSamples: 0,
  });
  res.json({ sessionId, roomCode });
});

app.post('/api/sessions/:id/end', (req, res) => {
  const { id } = req.params;
  const session = sessions.get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  const durationMs = Date.now() - session.startedAt;
  const focusScores = [];
  for (const [, entry] of session.students) {
    if (entry.vitals?.focusScore != null) focusScores.push(entry.vitals.focusScore);
  }
  const averageFocus =
    focusScores.length > 0
      ? Math.round((focusScores.reduce((a, b) => a + b, 0) / focusScores.length) * 100)
      : 0;
  const report = {
    roomCode: session.roomCode,
    studentCount: session.students.size,
    averageFocus,
    vitalsSamples: session.vitalsSamples,
    durationMs,
  };
  sessions.delete(id);
  res.json({ report });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();
const socketRoles = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('create-room', (callback) => {
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (rooms.has(roomCode));

    rooms.set(roomCode, { tutorIds: new Set(), studentIds: new Set() });
    socketRoles.set(socket.id, { role: 'tutor', roomCode });
    socket.join(roomCode);
    rooms.get(roomCode).tutorIds.add(socket.id);

    console.log(`Tutor ${socket.id} created room ${roomCode}`);
    callback({ success: true, roomCode });
  });

  socket.on('join-room', ({ roomCode, userId, role }, callback) => {
    const room = rooms.get(roomCode);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    socketRoles.set(socket.id, { role, userId, roomCode });
    socket.join(roomCode);
    if (role === 'tutor') {
      room.tutorIds.add(socket.id);
    } else {
      room.studentIds.add(socket.id);
    }

    for (const tutorId of room.tutorIds) {
      io.to(tutorId).emit('student-joined', { socketId: socket.id, roomCode, role });
    }

    console.log(`${role} ${socket.id} joined room ${roomCode}`);
    callback({ success: true, roomCode });
  });

  socket.on('send-vitals', ({ roomCode, userId, vitals }) => {
    const info = socketRoles.get(socket.id);
    if (!info || info.role !== 'student' || !roomCode) {
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      return;
    }

    // Track session vitals samples for report
    const sessionEntry = [...sessions.values()].find((s) => s.roomCode === roomCode);
    if (sessionEntry) {
      sessionEntry.vitalsSamples = (sessionEntry.vitalsSamples || 0) + 1;
      sessionEntry.students.set(userId, { vitals, lastUpdated: Date.now() });
    }

    const payload = {
      userId,
      vitals: {
        pulse: vitals.pulse ?? null,
        breathingRate: vitals.breathingRate ?? null,
        blinkRate: vitals.blinkRate ?? null,
        talking: vitals.talking ?? false,
        facialExpression: vitals.facialExpression ?? 'neutral',
        focusScore: vitals.focusScore ?? 0,
        faceDetected: vitals.faceDetected ?? true,
      },
      timestamp: Date.now(),
    };

    for (const tutorId of room.tutorIds) {
      io.to(tutorId).emit('vitals-update', payload);
    }

    console.log(`Vitals from student ${userId} in room ${roomCode}: focus=${payload.vitals.focusScore}`);
  });

  socket.on('leave-room', ({ roomCode }) => {
    const info = socketRoles.get(socket.id);
    if (!info) return;

    const room = rooms.get(roomCode);
    if (room) {
      if (info.role === 'tutor') {
        room.tutorIds.delete(socket.id);
      } else {
        room.studentIds.delete(socket.id);
      }
      for (const tutorId of room.tutorIds) {
        io.to(tutorId).emit('student-left', { socketId: socket.id, roomCode });
      }
      if (room.tutorIds.size === 0 && room.studentIds.size === 0) {
        rooms.delete(roomCode);
      }
    }
    socketRoles.delete(socket.id);
    console.log(`Client left room ${roomCode}: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    const info = socketRoles.get(socket.id);
    if (!info) return;

    const room = rooms.get(info.roomCode);
    if (room) {
      if (info.role === 'tutor') {
        room.tutorIds.delete(socket.id);
      } else {
        room.studentIds.delete(socket.id);
      }
      if (room.tutorIds.size === 0 && room.studentIds.size === 0) {
        rooms.delete(info.roomCode);
      }
    }
    socketRoles.delete(socket.id);
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io + REST server listening on http://localhost:${PORT}`);
});

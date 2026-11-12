import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

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

  socket.on('join-room', ({ roomCode }, callback) => {
    const room = rooms.get(roomCode);
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    socketRoles.set(socket.id, { role: 'student', roomCode });
    socket.join(roomCode);
    room.studentIds.add(socket.id);

    for (const tutorId of room.tutorIds) {
      io.to(tutorId).emit('student-joined', { socketId: socket.id, roomCode });
    }

    console.log(`Student ${socket.id} joined room ${roomCode}`);
    callback({ success: true, roomCode });
  });

  socket.on('send-vitals', ({ roomCode, pulse, hrv }) => {
    const info = socketRoles.get(socket.id);
    if (!info || info.role !== 'student' || !roomCode) {
      return;
    }

    const room = rooms.get(roomCode);
    if (!room) {
      return;
    }

    const vitals = { socketId: socket.id, pulse, hrv, roomCode, timestamp: Date.now() };
    for (const tutorId of room.tutorIds) {
      io.to(tutorId).emit('receive-vitals', vitals);
    }

    console.log(`Vitals from student ${socket.id} in room ${roomCode}: pulse=${pulse}, hrv=${hrv}`);
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
  console.log(`Socket.io server listening on http://localhost:${PORT}`);
});

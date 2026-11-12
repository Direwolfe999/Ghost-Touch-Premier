// server/sockets/vitals.js
import { db } from '../db.js';

export function setupVitalsSockets(io) {
  io.on('connection', (socket) => {
    console.log('[socket] client connected:', socket.id);

    socket.on('join-room', (roomCode) => {
      if (!roomCode) return;
      socket.join(roomCode);
      console.log(`[socket] ${socket.id} joined room ${roomCode}`);
      socket.to(roomCode).emit('user-joined', { socketId: socket.id, roomCode });
    });

    socket.on('send-vitals', ({ roomCode, pulse, breathing, focusScore, role }) => {
      if (!roomCode) return;

      // Persist to session history
      const session = db.findSessionByCode(roomCode);
      if (session) {
        db.addVitalsToSession(session.id, {
          pulse,
          breathing,
          focusScore,
          role,
          source: socket.id,
          receivedAt: Date.now(),
        });
      }

      // Broadcast to everyone in the room (tutor receives it)
      io.to(roomCode).emit('vitals-update', {
        roomCode,
        pulse,
        breathing,
        focusScore,
        role,
        source: socket.id,
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      console.log('[socket] client disconnected:', socket.id);
    });
  });
}

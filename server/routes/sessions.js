// server/routes/sessions.js
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { db } from '../db.js';

const router = express.Router();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GH-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/sessions/create — Tutor only
router.post('/create', authenticateToken, requireRole('tutor'), (req, res) => {
  try {
    const roomCode = generateRoomCode();

    // Ensure code is unique
    if (db.findSessionByCode(roomCode)) {
      return res.status(409).json({ error: 'Room code collision, retry' });
    }

    const session = db.createSession({
      roomCode,
      tutorId: req.user.id,
    });

    res.json({
      roomCode: session.roomCode,
      sessionId: session.id,
      status: session.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create session' });
  }
});

// POST /api/sessions/join — Student only
router.post('/join', authenticateToken, requireRole('student'), (req, res) => {
  try {
    const { roomCode } = req.body || {};

    if (!roomCode) {
      return res.status(400).json({ error: 'roomCode required' });
    }

    const session = db.findSessionByCode(roomCode);
    if (!session) {
      return res.status(404).json({ error: 'Room code not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    db.addStudentToSession(session.id, req.user.id);

    res.json({
      roomCode: session.roomCode,
      sessionId: session.id,
      tutorId: session.tutorId,
      status: session.status,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to join session' });
  }
});

// POST /api/sessions/:id/end — Tutor only
router.post('/:id/end', authenticateToken, requireRole('tutor'), (req, res) => {
  try {
    const session = db.findSessionById(Number(req.params.id));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.tutorId !== req.user.id) {
      return res.status(403).json({ error: 'Only the tutor who created this session can end it' });
    }

    db.endSession(session.id);

    // Calculate average focus score from history
    const focusScores = session.history
      .filter((h) => h.focusScore != null)
      .map((h) => h.focusScore);

    const avgFocus =
      focusScores.length > 0
        ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
        : null;

    const report = {
      sessionId: session.id,
      roomCode: session.roomCode,
      tutorId: session.tutorId,
      studentCount: session.students.length,
      status: 'ended',
      durationMs: session.endedAt - session.createdAt,
      averageFocus: avgFocus,
      vitalsSamples: session.history.length,
      createdAt: session.createdAt,
      endedAt: session.endedAt,
    };

    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to end session' });
  }
});

export default router;

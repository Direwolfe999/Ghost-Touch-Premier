// server/db.js
// In-memory store for the Ghost Touch Premier hackathon.
// Swappable for Postgres/SQLite later — just replace these arrays
// with DB queries while keeping the same export shape.

const users = [];
const sessions = [];

let nextUserId = 1;
let nextSessionId = 1;

export const db = {
  users,
  sessions,
  nextUserId,
  nextSessionId,

  findUserByEmail(email) {
    return users.find((u) => u.email === email);
  },

  findUserById(id) {
    return users.find((u) => u.id === id);
  },

  createUser(user) {
    const id = nextUserId++;
    const newUser = { id, ...user };
    users.push(newUser);
    return newUser;
  },

  findSessionByCode(roomCode) {
    return sessions.find((s) => s.roomCode === roomCode);
  },

  findSessionById(id) {
    return sessions.find((s) => s.id === id);
  },

  createSession(session) {
    const id = nextSessionId++;
    const newSession = {
      id,
      ...session,
      students: [],
      history: [],
      status: 'active',
      createdAt: Date.now(),
    };
    sessions.push(newSession);
    return newSession;
  },

  addStudentToSession(sessionId, studentId) {
    const session = this.findSessionById(sessionId);
    if (session && !session.students.includes(studentId)) {
      session.students.push(studentId);
    }
    return session;
  },

  addVitalsToSession(sessionId, vitals) {
    const session = this.findSessionById(sessionId);
    if (session) {
      session.history.push({ ...vitals, receivedAt: Date.now() });
    }
    return session;
  },

  endSession(sessionId) {
    const session = this.findSessionById(sessionId);
    if (session) {
      session.status = 'ended';
      session.endedAt = Date.now();
    }
    return session;
  },

  getActiveSessions() {
    return sessions.filter((s) => s.status === 'active');
  },
};

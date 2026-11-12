import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.js';
import { socket } from '../lib/socket.js';
import { useSessionSocket } from '../hooks/useSessionSocket.js';
import StudentTile from '../components/StudentTile.jsx';
import VerificationPanel from '../components/VerificationPanel.jsx';

const API = 'http://localhost:3001/api';

export default function TutorDashboard() {
  const { user, token, clearAuth } = useStore();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [report, setReport] = useState(null);
  const [verificationStudent, setVerificationStudent] = useState(null);
  const [history, setHistory] = useState({});
  const maxSamples = 30;

  if (!user || !token) {
    return null;
  }

  const { students, connected } = useSessionSocket({
    roomCode: session ? session.roomCode : null,
    userId: user.id,
    role: 'tutor',
  });

  // Merge socket vitals into local history for sparklines
  useEffect(() => {
    const newHistory = { ...history };
    let changed = false;
    for (const [id, entry] of Object.entries(students)) {
      const v = entry.vitals;
      if (!v || v.focusScore == null) continue;
      const arr = newHistory[id] || [];
      arr.push(v.focusScore);
      if (arr.length > maxSamples) arr.shift();
      newHistory[id] = arr;
      changed = true;
    }
    if (changed) setHistory(newHistory);
  }, [students, history]);

  const avgFocus = () => {
    const scores = Object.values(students).filter((s) => s.vitals?.focusScore != null).map((s) => s.vitals.focusScore);
    if (!scores.length) return 0;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
  };

  const alerts = () => {
    return Object.values(students).filter((s) => {
      const v = s.vitals;
      if (!v || !v.faceDetected) return false;
      return v.focusScore < 0.4;
    }).length;
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    const form = e.target.elements;
    const name = form['session-name'].value || 'Untitled session';
    const subject = form['session-subject'].value || 'General';

    try {
      const res = await fetch(`${API}/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, subject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session');

      const newSession = {
        sessionId: data.sessionId,
        roomCode: data.roomCode,
        name,
        subject,
      };
      setSession(newSession);

      socket.emit('join-room', { roomCode: data.roomCode, userId: user.id, role: 'tutor' });
    } catch (err) {
      alert(err.message || 'Failed to create session');
    }
  };

  const handleEndSession = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API}/sessions/${session.sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to end session');

      setReport(data.report);
      socket.emit('leave-room', { roomCode: session.roomCode });
    } catch (err) {
      alert(err.message || 'Failed to end session');
    }
  };

  const handleReset = () => {
    setSession(null);
    setReport(null);
    setHistory({});
    socket.emit('leave-room', { roomCode: session ? session.roomCode : null });
  };

  const handleLogout = () => {
    clearAuth();
    socket.disconnect();
    navigate('/');
  };

  if (report) {
    return (
      <div className="tutor-dashboard report-modal">
        <div className="report-card">
          <h2>Session Report</h2>
          <p>Room: {report.roomCode}</p>
          <p>Students: {report.studentCount}</p>
          <p>Average focus: {report.averageFocus != null ? report.averageFocus + '%' : 'N/A'}</p>
          <p>Vitals samples: {report.vitalsSamples}</p>
          <p>Duration: {(report.durationMs / 1000).toFixed(0)}s</p>
          <button className="btn-primary" onClick={handleReset}>
            Start New Session
          </button>
          <button className="btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  const isLive = !!session;

  return (
    <div className="tutor-dashboard">
      <header className="dashboard-header">
        <div className="brand">Ghost<span className="brand-accent">-Touch</span></div>
        {isLive ? (
          <div className="live-header">
            <span className="room-label">Room: {session.roomCode}</span>
            <button className="btn-danger" onClick={handleEndSession}>
              End Session
            </button>
          </div>
        ) : null}
      </header>

      {!isLive ? (
        <div className="setup-view">
          <h1>Start a Session</h1>
          <form onSubmit={handleStartSession} className="setup-form">
            <label>Session name</label>
            <input name="session-name" defaultValue="Untitled session" />
            <label>Subject (optional)</label>
            <input name="session-subject" defaultValue="General" />
            <button type="submit" className="btn-primary">Start Session</button>
          </form>
        </div>
      ) : (
        <div className="live-view">
          <div className="stats-strip">
            <div className="stat-card">
              <div className="stat-label">Students</div>
              <div className="stat-value">{Object.keys(students).length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg focus</div>
              <div className="stat-value">{avgFocus()}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Alerts</div>
              <div className="stat-value">{alerts()}</div>
            </div>
          </div>

          {Object.keys(students).length === 0 ? (
            <div className="empty-state">
              <p>Waiting for students to join room <strong>{session.roomCode}</strong>…</p>
            </div>
          ) : (
            <div className="student-grid">
              {Object.entries(students).map(([id, entry]) => {
                const vitalsWithSpark = entry.vitals
                  ? { ...entry.vitals, _sparkline: (history[id] || []).map((y, i) => ({ x: i, y })) }
                  : null;
                return (
                  <StudentTile
                    key={id}
                    studentId={id}
                    name={entry.name}
                    vitals={vitalsWithSpark}
                    lastUpdated={entry.lastUpdated}
                    onOpenVerification={(sid) => setVerificationStudent(sid)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {verificationStudent && students[verificationStudent] && (
        <VerificationPanel
          studentName={students[verificationStudent].name}
          vitals={students[verificationStudent].vitals}
          onClose={() => setVerificationStudent(null)}
        />
      )}

      <button className="btn-logout" onClick={handleLogout}>
        Log out
      </button>
    </div>
  );
}

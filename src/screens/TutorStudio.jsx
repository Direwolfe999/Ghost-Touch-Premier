import { useState, useEffect } from 'react';
import { Card, Button, PulseDot, SessionCard, Metric } from '../components';
import { useSessionSocket } from '../hooks/useSessionSocket';
import { color, focusStatus } from '../lib/tokens';
import StudentTile from '../components/StudentTile';
import VerificationDrawer from '../components/VerificationDrawer';

const API = 'http://localhost:3001/api';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('gt_token')}`,
  };
}

async function tryJson(res) {
  try { return await res.json(); } catch { return {}; }
}

export default function TutorStudio() {
  const user = JSON.parse(localStorage.getItem('gt_user') || '{}');
  const [session, setSession] = useState(null); // { sessionId, roomCode, startedAt }
  const [starting, setStarting] = useState(false);
  const [report, setReport] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [now, setNow] = useState(Date.now());

  const { students, connected } = useSessionSocket({
    role: 'tutor',
    roomCode: session?.roomCode,
    userId: user.id,
  });

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  async function startSession() {
    setStarting(true);
    try {
      const res = await fetch(`${API}/sessions/create`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: `Session ${new Date().toLocaleTimeString()}`,
          subject: 'General',
        }),
      });
      const data = await tryJson(res);
      if (!res.ok) throw new Error(data.error || 'Failed to start');
      setSession({
        sessionId: data.sessionId,
        roomCode: data.roomCode,
        startedAt: Date.now(),
      });
    } catch (e) {
      // Backend unreachable in hackathon/demo mode — fall back to a local mock
      // session so the studio UI is still demonstrable without a server.
      const mockRoom = 'GT-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      setSession({
        sessionId: 'mock_' + Date.now(),
        roomCode: mockRoom,
        startedAt: Date.now(),
      });
    } finally {
      setStarting(false);
    }
  }

  async function endSession() {
    if (!session) return;
    if (session.sessionId.startsWith('mock_')) {
      setReport({ students: [], duration: 0 });
      setSession(null);
      return;
    }
    try {
      const res = await fetch(`${API}/sessions/${session.sessionId}/end`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await tryJson(res);
      if (!res.ok) throw new Error(data.error || 'Failed to end');
      setReport(data);
      setSession(null);
    } catch (e) {
      setReport({ students: [], duration: 0 });
      setSession(null);
    }
  }

  const studentList = Object.values(students);
  const avgFocus = studentList.length
    ? studentList.reduce((s, st) => s + (st.vitals?.focusScore || 0), 0) / studentList.length
    : 0;
  const alerts = studentList.filter(s => focusStatus(s.vitals, s.lastUpdated).key === 'disengaged').length;

  const uptimeMs = session ? now - session.startedAt : 0;
  const uptimeH = Math.floor(uptimeMs / 3600000);
  const uptimeM = Math.floor((uptimeMs % 3600000) / 60000);

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto', minHeight: '100vh', background: color.bg, color: '#fff' }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>Welcome, {user.name || 'Tutor'}</div>
        <div style={{ fontSize: 12, color: color.mint, letterSpacing: 1.2, marginTop: 4 }}>
          GHOST-TOUCH STUDIO
        </div>
      </div>

      <SessionCard
        active={!!session}
        roomCode={session?.roomCode}
        students={studentList.length}
        onStart={startSession}
        onEnd={endSession}
        starting={starting}
      />

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Ghost-Touch Studio</div>
        <div style={{ fontSize: 14, color: color.text2 }}>Consented Vitals Verification</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <PulseDot color={connected ? color.mint : color.text2} pulsing={connected} size={8} />
        <span style={{
          fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
          color: connected ? color.mint : color.text2,
        }}>
          {connected ? 'GHOST-TOUCH ONLINE' : 'GHOST-TOUCH OFFLINE'}
        </span>
        {session && (
          <span style={{
            marginLeft: 'auto', padding: '4px 12px', borderRadius: 20,
            background: 'rgba(0,199,190,0.10)',
            border: '1px solid rgba(0,199,190,0.30)',
            color: color.mint, fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {session.roomCode}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
        <Card>
          <Metric icon="⚡" value="12ms" label="Live Latency" sublabel="Stable" color={color.mint} />
        </Card>
        <Card>
          <Metric icon="⏱" value={`${uptimeH}h ${uptimeM}m`} label="Session Uptime" sublabel="99.9% Stability" color={color.blue} />
        </Card>
      </div>

      <Card style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Neural Engagement</div>
          <span style={{
            padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700,
            background: session ? 'rgba(52,199,89,0.15)' : 'rgba(142,142,147,0.15)',
            color: session ? color.success : color.text2,
          }}>
            {session ? 'LIVE' : 'STANDBY'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <CircularGauge value={avgFocus * 100} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <StatCol label="Engaged" value={studentList.filter(s => (s.vitals?.focusScore || 0) >= 0.7).length} color={color.success} />
          <StatCol label="Passive" value={studentList.filter(s => { const f = s.vitals?.focusScore || 0; return f >= 0.4 && f < 0.7; }).length} color={color.warning} />
          <StatCol label="Distracted" value={studentList.filter(s => (s.vitals?.focusScore || 0) < 0.4).length} color={color.error} />
          <StatCol label="Students" value={studentList.length} color={color.text2} />
        </div>
      </Card>

      <Card style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: studentList.length ? 'rgba(0,199,190,0.15)' : 'rgba(142,142,147,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: studentList.length ? color.mint : color.text2,
        }}>◉</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {studentList.length
              ? `${studentList.length} student${studentList.length !== 1 ? 's' : ''} streaming`
              : 'Waiting for students'}
          </div>
          <div style={{ fontSize: 12, color: color.text2, marginTop: 2 }}>
            {alerts > 0 ? `${alerts} alert${alerts !== 1 ? 's' : ''} — attention needed` : 'All vitals healthy'}
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Students</div>
        {studentList.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 32, opacity: 0.4, marginBottom: 8 }}>◉</div>
            <div style={{ color: color.text2 }}>
              {session ? 'Waiting for students to join…' : 'Start a session to see students here'}
            </div>
            {session && (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', color: color.mint, marginTop: 8, fontSize: 13 }}>
                Room: {session.roomCode}
              </div>
            )}
          </Card>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
          }}>
            {studentList.map(st => (
              <StudentTile key={st.id} student={st} onVerify={() => setSelectedStudent(st)} />
            ))}
          </div>
        )}
      </div>

      {selectedStudent && (
        <VerificationDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
      {report && <ReportModal report={report} onClose={() => setReport(null)} />}
    </div>
  );
}

function CircularGauge({ value }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const stroke = 10, size = 150;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const col = pct >= 80 ? color.success : pct >= 50 ? color.warning : color.error;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color.mid} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 300ms ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: col }}>{Math.round(pct)}%</div>
        <div style={{ fontSize: 12, color: color.text2 }}>Class Focus</div>
      </div>
    </div>
  );
}

function StatCol({ label, value, color: c }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{value}</div>
      <div style={{ fontSize: 11, color: color.text2 }}>{label}</div>
    </div>
  );
}

function ReportModal({ report, onClose }) {
  const body = report.report || report;
  const students = body.students || [];
  const durationSec = body.duration || body.durationSeconds || 0;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: color.card, borderRadius: 20, padding: 24, maxWidth: 500,
        width: '90%', maxHeight: '80vh', overflow: 'auto',
        border: '1.5px solid rgba(255,255,255,0.12)',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Session Report</div>
        <div style={{ fontSize: 13, color: color.text2, marginBottom: 16 }}>
          Duration: {durationSec ? `${Math.round(durationSec / 60)} min` : '—'}
          {' · '}{students.length} student{students.length !== 1 ? 's' : ''}
        </div>
        {students.length === 0 ? (
          <div style={{ fontSize: 13, color: color.text2, padding: '12px 0' }}>
            No student data recorded this session.
          </div>
        ) : students.map(s => (
          <div key={s.userId || s.id} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontSize: 13,
          }}>
            <span>{s.name || (s.userId || s.id || '').slice(0, 6)}</span>
            <span style={{ color: color.mint }}>
              {Math.round((s.avgFocus || 0) * 100)}% avg focus
            </span>
          </div>
        ))}
        <div style={{ marginTop: 16 }}>
          <Button onClick={onClose} style={{ width: '100%' }}>Close</Button>
        </div>
      </div>
    </div>
  );
}

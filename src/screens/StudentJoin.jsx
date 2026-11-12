import React, { useState } from 'react';
import { useStore } from '../store.js';
import { useNavigate } from 'react-router-dom';

export default function StudentJoin() {
  const { userName, userRole, setRoomCode, clearAuth, clearStore } = useStore();
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setRoomCode(code.trim());
    navigate('/student/session');
  };

  const handleLogout = () => {
    if (typeof clearAuth === 'function') clearAuth();
    if (typeof clearStore === 'function') clearStore();
    navigate('/');
  };

  return (
    <div className="page">
      <h1>Join a Session</h1>
      <p>Welcome{userName ? `, ${userName}` : ''}. Enter a session code to join.</p>
      <form onSubmit={handleJoin} style={{ maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        <input
          placeholder="Session code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button type="submit" className="btn-primary">Join session</button>
      </form>
      <button className="btn-ghost" style={{ marginTop: 16 }} onClick={handleLogout}>Log out</button>
    </div>
  );
}

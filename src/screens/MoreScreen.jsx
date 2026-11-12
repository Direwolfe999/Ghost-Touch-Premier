import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.js';

export default function MoreScreen() {
  const navigate = useNavigate();
  const { userName, userRole, roomCode, clearAuth, clearStore } = useStore();

  const handleLogout = () => {
    if (typeof clearAuth === 'function') clearAuth();
    if (typeof clearStore === 'function') clearStore();
    navigate('/');
  };

  return (
    <div className="page more-screen">
      <h1>More</h1>
      <div className="more-card">
        <div className="more-row"><span className="more-label">User</span><span>{userName || '—'}</span></div>
        <div className="more-row"><span className="more-label">Role</span><span>{userRole || '—'}</span></div>
        <div className="more-row"><span className="more-label">Room</span><span>{roomCode || '—'}</span></div>
      </div>
      <div className="more-actions">
        <button className="btn-primary" onClick={() => navigate('/tutor/dashboard')}>Tutor Dashboard</button>
        <button className="btn-primary" onClick={() => navigate('/student/join')}>Student Join</button>
        <button className="btn-primary" onClick={() => navigate('/student/session')}>Student Session</button>
        <button className="btn-ghost" onClick={handleLogout}>Log out</button>
      </div>
    </div>
  );
}

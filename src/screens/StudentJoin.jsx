import React from 'react';
import { useStore } from '../store.js';
import { useNavigate } from 'react-router-dom';

export default function StudentJoin() {
  const { userName, userRole, clearStore } = useStore();
  const navigate = useNavigate();
  return (
    <div className="page">
      <h1>Join a Session</h1>
      <p>Welcome{userName ? `, ${userName}` : ''}. Role: {userRole}. Enter a session code to join.</p>
      <button onClick={() => { clearStore(); navigate('/'); }}>Log out</button>
    </div>
  );
}

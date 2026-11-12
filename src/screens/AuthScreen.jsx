import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.js';

const API = 'http://localhost:3001/api';

export default function AuthScreen() {
  const navigate = useNavigate();
  const { setAuth, setRoomCode, setUser } = useStore();

  const [role, setRole] = useState(null);
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!role) return setError('Please select Tutor or Student');
    if (!form.email || !form.password) return setError('Email and password required');
    if (mode === 'signup' && !form.name) return setError('Name required');

    setLoading(true);
    try {
      const res = await fetch(`${API}/${mode === 'signup' ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${mode} failed`);

      setAuth(data.user, data.token);

      if (role === 'tutor') {
        const code = 'GH-' + Math.floor(1000 + Math.random() * 9000);
        setRoomCode(code);
        navigate('/tutor/dashboard');
      } else {
        setUser(role, data.user.name);
        navigate('/student/session');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <h1>Ghost-Touch</h1>
        <p>See the invisible classroom</p>
      </div>

      <div className="role-row">
        <button
          type="button"
          className={`role-card ${role === 'tutor' ? 'selected' : ''}`}
          onClick={() => setRole('tutor')}
        >
          <span className="role-icon">👨‍🏫</span>
          <span className="role-title">Tutor</span>
          <span className="role-subtitle">I teach</span>
        </button>
        <button
          type="button"
          className={`role-card ${role === 'student' ? 'selected' : ''}`}
          onClick={() => setRole('student')}
        >
          <span className="role-icon">🎓</span>
          <span className="role-title">Student</span>
          <span className="role-subtitle">I learn</span>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={!role || loading}>
          {loading ? 'Signing in...' : role === 'tutor' ? 'Create Session' : 'Join Session'}
        </button>
      </form>

      <button className="link" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
        {mode === 'signup' ? 'Already have an account? Log in' : 'New here? Sign up'}
      </button>
    </div>
  );
}

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthScreen from './screens/AuthScreen.jsx';
import TutorDashboard from './screens/TutorDashboard.jsx';
import StudentJoin from './screens/StudentJoin.jsx';
import StudentSession from './screens/StudentSession.jsx';
import { useStore } from './store.js';

function ProtectedRoute({ role, children }) {
  const { userRole } = useStore();
  if (!userRole) return <Navigate to="/" replace />;
  if (role && userRole !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AuthScreen />} />
        <Route
          path="/tutor/dashboard"
          element={
            <ProtectedRoute role="tutor">
              <TutorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/join"
          element={
            <ProtectedRoute role="student">
              <StudentJoin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/session"
          element={
            <ProtectedRoute role="student">
              <StudentSession />
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
  );
}

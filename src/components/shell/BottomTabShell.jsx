import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/tutor/dashboard', label: 'Tutor', icon: '👨‍🏫' },
  { to: '/student/join', label: 'Join', icon: '🎓' },
  { to: '/student/session', label: 'Session', icon: '📡' },
  { to: '/more', label: 'More', icon: '⋯' },
];

export default function BottomTabShell({ children }) {
  const location = useLocation();
  const hideOn = ['/'];
  if (hideOn.includes(location.pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="gt-shell">
      <main className="gt-shell-content">{children}</main>
      <nav className="gt-bottom-tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `gt-tab ${isActive ? 'active' : ''}`
            }
            end={tab.to === '/'}
          >
            <span className="gt-tab-icon">{tab.icon}</span>
            <span className="gt-tab-label">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

import React from 'react';

export default function RoleCard({ icon, title, subtitle, selected, onClick }) {
  return (
    <button
      type="button"
      className={`role-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <span className="role-icon">{icon}</span>
      <span className="role-title">{title}</span>
      <span className="role-subtitle">{subtitle}</span>
    </button>
  );
}

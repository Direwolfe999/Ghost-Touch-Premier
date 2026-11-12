import { useEffect, useRef, useState } from 'react';
import { socket } from '../lib/socket.js';

const DEBOUNCE_MS = 250;

export function useSessionSocket({ roomCode, userId, role }) {
  const [students, setStudents] = useState({});
  const [connected, setConnected] = useState(socket.connected);
  const pendingRef = useRef(null);
  const debounceRef = useRef(null);
  const pendingUpdates = useRef({});

  useEffect(() => {
    if (!roomCode || !userId) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.emit('join-room', { roomCode, userId, role });

    const flush = () => {
      const updates = { ...pendingUpdates.current };
      pendingUpdates.current = {};
      debounceRef.current = null;

      setStudents((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [srcId, entry] of Object.entries(updates)) {
          const existing = next[srcId] || {};
          const name = existing.name || `Student ${String(srcId).slice(0, 4)}`;
          next[srcId] = {
            name,
            vitals: entry.vitals,
            lastUpdated: entry.timestamp,
          };
          changed = true;
        }
        return changed ? next : prev;
      });
    };

    const handleVitals = ({ userId: srcId, vitals, timestamp }) => {
      if (!srcId || srcId === userId) return;

      pendingUpdates.current[srcId] = { vitals, timestamp };

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(flush, DEBOUNCE_MS);
    };

    socket.on('vitals-update', handleVitals);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('vitals-update', handleVitals);
      socket.emit('leave-room', { roomCode });
    };
  }, [roomCode, userId, role]);

  return { students, connected };
}

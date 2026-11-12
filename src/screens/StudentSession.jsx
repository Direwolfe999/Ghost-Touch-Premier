import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store.js';
import { useNavigate } from 'react-router-dom';
import { socket } from '../lib/socket.js';

import {
  SmartSpectraSDK,
  ProcessingStatus,
  breathingMetrics,
  cardioMetrics,
} from '@smartspectra/node-sdk/renderer';
import { decodeMetrics } from '@smartspectra/node-sdk/messages';

const API_KEY = import.meta.env.VITE_PRESGAGE_API_KEY || '';

export default function StudentSession() {
  const { userName, userRole, roomCode, clearStore } = useStore();
  const navigate = useNavigate();

  const [consentGiven, setConsentGiven] = useState(false);
  const [pulse, setPulse] = useState(null);
  const [breathingRate, setBreathingRate] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sdkRef = useRef(null);
  const emitIntervalRef = useRef(null);
  const latestPulseRef = useRef(null);
  const latestBreathingRef = useRef(null);

  // Client-side userId for students (server doesn't issue one on student login)
  const userIdRef = useRef(
    'student_' + Math.random().toString(36).slice(2, 10)
  );

  // --- SDK lifecycle: runs once after consent ---
  useEffect(() => {
    if (!consentGiven) return;

    const requested = [...breathingMetrics, ...cardioMetrics];
    sdkRef.current = new SmartSpectraSDK({
      apiKey: API_KEY,
      requestedMetrics: requested,
      enableAccumulatedOutput: false,
    });

    sdkRef.current.on('processingStatus', (s) => {
      setStatus(ProcessingStatus[s] || `Status(${s})`);
    });

    sdkRef.current.on('metrics', (buf, timestampUs) => {
      try {
        const decoded = decodeMetrics(buf);
        const pr = decoded.cardio?.pulseRate?.[0]?.value;
        const br = decoded.breathing?.rate?.[0]?.value;
        if (pr != null) {
          setPulse(pr);
          latestPulseRef.current = pr;
        }
        if (br != null) {
          setBreathingRate(br);
          latestBreathingRef.current = br;
        }
      } catch (e) {
        console.error('failed to decode metrics:', e);
      }
    });

    sdkRef.current.on('streamAvailable', (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    });

    sdkRef.current.on('error', (code, message) => {
      setError(`${code}: ${message}`);
    });

    const startSdk = async () => {
      try {
        await sdkRef.current.start();
      } catch (err) {
        setError(err.message || 'SDK start failed');
      }
    };
    startSdk();

    return () => {
      if (sdkRef.current) {
        try { sdkRef.current.stop(); } catch {}
        try { sdkRef.current.destroy(); } catch {}
        sdkRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [consentGiven]);

  // --- Socket.io lifecycle: runs once after consent ---
  useEffect(() => {
    if (!consentGiven) return;

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    if (roomCode) {
      socket.emit('join-room', {
        roomCode,
        userId: userIdRef.current,
        role: userRole,
      });
    }

    return () => {
      socket.off('connect', () => setSocketConnected(true));
      socket.off('disconnect', () => setSocketConnected(false));
      if (roomCode) {
        socket.emit('leave-room', { roomCode });
      }
    };
  }, [consentGiven, roomCode, userRole]);

  // --- Vitals emit interval: 2 seconds ---
  useEffect(() => {
    if (!consentGiven) return;

    emitIntervalRef.current = setInterval(() => {
      if (
        socket.connected &&
        latestPulseRef.current != null &&
        roomCode
      ) {
        socket.emit('send-vitals', {
          roomCode,
          userId: userIdRef.current,
          vitals: {
            pulse: latestPulseRef.current,
            breathingRate: latestBreathingRef.current,
            blinkRate: null,
            talking: false,
            facialExpression: 'neutral',
            focusScore: latestPulseRef.current
              ? Math.min(1, latestPulseRef.current / 100)
              : 0,
            faceDetected: true,
          },
        });
      }
    }, 2000);

    return () => {
      if (emitIntervalRef.current) clearInterval(emitIntervalRef.current);
    };
  }, [consentGiven, roomCode, userRole]);

  const handleConsent = () => setConsentGiven(true);

  const handleLogout = () => {
    clearStore();
    socket.disconnect();
    navigate('/');
  };

  if (!consentGiven) {
    return (
      <div className="page consent-modal">
        <div className="consent-card">
          <h1>Camera & Vitals Consent</h1>
          <p>
            Ghost-Touch needs access to your webcam to measure your pulse and
            breathing rate in real time. This data is shared live with your
            tutor during the session.
          </p>
          <p className="consent-detail">
            By clicking below you agree to:<br />
            &bull; Webcam access for vital-sign measurement<br />
            &bull; Live streaming of pulse and breathing data to your tutor
          </p>
          <button className="consent-btn" onClick={handleConsent}>
            I Consent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page student-session">
      <div className="session-header">
        <h1>Student Session</h1>
        <p>Welcome{userName ? `, ${userName}` : ''}. Room: {roomCode}</p>
        <div className="session-meta">
          <span className={`indicator ${socketConnected ? 'connected' : 'disconnected'}`}>
            {socketConnected ? 'Server connected' : 'Disconnected'}
          </span>
          <span className="sdk-status">SDK: {status}</span>
        </div>
        {error && <p className="session-error">{error}</p>}
      </div>

      <div className="vitals-grid">
        <div className="vital-card">
          <div className="vital-label">Pulse</div>
          <div className="vital-value">{pulse != null ? pulse.toFixed(0) : '—'}</div>
          <div className="vital-unit">BPM</div>
        </div>
        <div className="vital-card">
          <div className="vital-label">Breathing Rate</div>
          <div className="vital-value">{breathingRate != null ? breathingRate.toFixed(0) : '—'}</div>
          <div className="vital-unit">BR/min</div>
        </div>
      </div>

      <div className="camera-preview">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="camera-video"
        />
        <canvas ref={canvasRef} className="camera-canvas" />
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        Leave Session
      </button>
    </div>
  );
}

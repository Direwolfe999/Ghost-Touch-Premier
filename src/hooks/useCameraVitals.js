import { useEffect, useRef, useState } from 'react';

/**
 * DEMO PROXY — samples the camera at 64×64 to compute a motion-based focus score.
 * Replace the sample() body with SmartSpectra SDK calls when available.
 *
 * The vitals shape matches the backend socket contract exactly.
 */
export function useCameraVitals({ enabled }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const prevFrameRef = useRef(null);
  const activitySmoothRef = useRef(0.3);

  const [vitals, setVitals] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
        setCameraError(null);
        startLoop();
      } catch (err) {
        setCameraError(err.message || 'Camera permission denied');
      }
    }

    function startLoop() {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      function sample() {
        if (cancelled) return;

        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, 64, 64);
          const frame = ctx.getImageData(0, 0, 64, 64).data;

          let diff = 0;
          const prev = prevFrameRef.current;
          if (prev) {
            for (let i = 0; i < frame.length; i += 4) {
              diff += Math.abs(frame[i] - prev[i]);
            }
            diff /= (frame.length / 4) * 255;
          }
          prevFrameRef.current = new Uint8ClampedArray(frame);
          activitySmoothRef.current = activitySmoothRef.current * 0.9 + diff * 0.1;

          const activity = Math.min(1, activitySmoothRef.current * 10);
          const t = Date.now() / 1000;
          const breathWave = Math.sin(t * (2 * Math.PI / 4)) * 0.05;
          const focus = Math.max(0, Math.min(1, 1 - activity + breathWave));

          const pulse = 68 + Math.sin(t * 1.2) * 4 + Math.random() * 3;
          const breathingRate = 14 + Math.sin(t * 0.3) * 2 + Math.random();

          setVitals({
            pulse: Math.round(pulse),
            breathingRate: Math.round(breathingRate),
            blinkRate: 15 + Math.round(Math.random() * 5),
            talking: activity > 0.5,
            facialExpression: 'neutral',
            focusScore: parseFloat(focus.toFixed(2)),
            faceDetected: true,
          });
        }

        timerRef.current = setTimeout(sample, 500);
      }
      sample();
    }

    start();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      prevFrameRef.current = null;
      setCameraReady(false);
    };
  }, [enabled]);

  return { videoRef, canvasRef, vitals, cameraError, cameraReady };
}
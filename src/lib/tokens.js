// JS mirror for values you need in logic (charts, canvas, dynamic styles).
// Keep in sync with tokens.css — this is the only place hex codes should live.
export const color = {
  bg: {
    base: '#0A0A0A',
    deep: '#121212',
    pure: '#000000',
  },
  surface: {
    card: '#1C1C1E',
    mid: '#2C2C2E',
    high: '#3A3A3C',
    glass: '#F5F5F7',
  },
  brand: {
    primary: '#007AFF',
    mint: '#00C7BE',
    cyan: '#00E5FF',
    violet: '#8A2BE2',
  },
  premium: {
    gold: '#D4AF37',
    founder: '#FFD700',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#8E8E93',
    tertiary: '#636366',
    quaternary: '#494949',
    inverse: '#121212',
  },
  status: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    live: '#FF0000',
    terminal: '#39FF14',
    darkGreen: '#001A00',
  },
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  pill: 999,
  input: 15,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const breakpoint = {
  watch: 200,
  mobile: 600,
  tablet: 1024,
  desktop: 1920,
};

// Focus-state mapper — mirrors Flutter's StatusPill logic
export function focusStatus(vitals, lastUpdated) {
  if (!vitals) return { key: 'waiting', color: color.text.secondary, label: 'Waiting' };
  if (Date.now() - lastUpdated > 10_000) return { key: 'waiting', color: color.text.secondary, label: 'Waiting' };
  if (!vitals.faceDetected) return { key: 'camera', color: color.status.warning, label: 'Check camera' };
  if (vitals.focusScore >= 0.7) return { key: 'engaged', color: color.status.success, label: 'Engaged' };
  if (vitals.focusScore >= 0.4) return { key: 'load', color: color.status.warning, label: 'Cognitive load' };
  return { key: 'disengaged', color: color.status.error, label: 'Disengaged' };
}
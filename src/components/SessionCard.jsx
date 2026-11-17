export default function SessionCard({ active, roomCode, students, onStart, onEnd, starting = false }) {
  return (
    <Card style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Session</div>
        <div style={{ fontSize: 12, color: color.text2 }}>
          {active ? 'ACTIVE' : 'STANDBY'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={active ? onEnd : onStart}
          disabled={active ? false : starting}
          style={{
            flex: 1,
            background: active ? color.error : color.mint,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: 10,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {active ? 'End Session' : 'Start Session'}
        </button>
        {active && roomCode && (
          <div style={{
            padding: '6px 10px', borderRadius: 8, background: 'rgba(0,199,190,0.10)',
            border: '1px solid rgba(0,199,190,0.30)', color: color.mint, fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
          }}>
            {roomCode}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: color.text2 }}>
        <span>{students} student{students !== 1 ? 's' : ''}</span>
        <span>{active ? 'streaming' : 'idle'}</span>
      </div>
    </Card>
  );
}

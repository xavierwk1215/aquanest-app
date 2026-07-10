import type { Tank } from '../../lib/types';

export function TankList({ tanks, onAdd, onOpen }: { tanks: Tank[]; onAdd: () => void; onOpen: (id: string) => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p className="state-msg" style={{ padding: 0, textAlign: 'left', margin: 0 }}>
          저장된 어항의 사육 현황, 수질 기록, 리마인더를 관리하세요.
        </p>
        <button
          onClick={onAdd}
          style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#06201c', cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}
        >
          + 어항 추가
        </button>
      </div>

      {tanks.length === 0 ? (
        <p className="state-msg">아직 등록된 어항이 없습니다.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {tanks.map((tk) => (
            <button
              key={tk.id}
              onClick={() => onOpen(tk.id)}
              style={{
                textAlign: 'left',
                padding: '14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--teal)', marginBottom: 6 }}>{tk.volumeL}L</div>
              <div style={{ fontSize: 15, marginBottom: 4 }}>{tk.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {tk.lengthCm}×{tk.widthCm}×{tk.heightCm}cm
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import type { ReferenceData } from '../../lib/referenceData';
import type { Tank } from '../../lib/types';
import { RemindersTab } from './RemindersTab';
import { StockingTab } from './StockingTab';
import { WaterLogTab } from './WaterLogTab';

type SubTab = 'stocking' | 'waterlog' | 'reminders';

export function TankDetail({
  tank,
  referenceData,
  onBack,
  onEdit,
}: {
  tank: Tank;
  referenceData: ReferenceData;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [subtab, setSubtab] = useState<SubTab>('stocking');

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, marginBottom: 16, fontSize: 13 }}>
        ← 목록으로
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20 }}>{tank.name}</h2>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {tank.lengthCm}×{tank.widthCm}×{tank.heightCm}cm · {tank.volumeL}L
          </div>
        </div>
        <button onClick={onEdit} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>
          수정
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        {(
          [
            ['stocking', '사육 현황'],
            ['waterlog', '수질 기록'],
            ['reminders', '리마인더'],
          ] as [SubTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubtab(key)}
            style={{
              padding: '8px 12px',
              fontSize: 13,
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${subtab === key ? 'var(--teal)' : 'transparent'}`,
              color: subtab === key ? 'var(--teal)' : 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {subtab === 'stocking' && <StockingTab tank={tank} referenceData={referenceData} />}
      {subtab === 'waterlog' && <WaterLogTab tank={tank} />}
      {subtab === 'reminders' && <RemindersTab tank={tank} />}
    </div>
  );
}

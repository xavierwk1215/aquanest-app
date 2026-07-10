import { useEffect, useState } from 'react';
import { addDaysStr, addReminder, deleteReminder, listReminders, markReminderDone, reminderStatus } from '../../lib/tanks';
import type { Reminder, Tank } from '../../lib/types';

const STATUS_COLOR: Record<'overdue' | 'due-today' | 'ok', string> = {
  overdue: 'var(--danger)',
  'due-today': 'var(--amber)',
  ok: 'var(--border)',
};

function statusText(r: Reminder): string {
  const status = reminderStatus(r);
  const next = addDaysStr(r.lastDone, r.intervalDays);
  if (status === 'overdue') return `${next}에 예정이었음 (지남)`;
  if (status === 'due-today') return '오늘 예정';
  return `다음: ${next}`;
}

export function RemindersTab({ tank }: { tank: Tank }) {
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [interval, setInterval] = useState(7);

  function refresh() {
    listReminders(tank.id)
      .then(setReminders)
      .catch((err: Error) => setError(err.message));
  }

  useEffect(refresh, [tank.id]);

  async function submit() {
    if (!label.trim()) return;
    try {
      await addReminder(tank.id, label.trim(), interval || 7);
      setLabel('');
      setInterval(7);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function markDone(id: string) {
    try {
      await markReminderDone(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(id: string) {
    try {
      await deleteReminder(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="예: 급여, 환수"
          style={{ flex: 2, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        />
        <input
          type="number"
          value={interval}
          onChange={(e) => setInterval(parseInt(e.target.value, 10) || 7)}
          style={{ width: 80, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        />
      </div>
      <button onClick={submit} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#06201c', cursor: 'pointer', marginBottom: 20 }}>
        리마인더 추가
      </button>

      {error && <p className="state-msg error" style={{ padding: '0 0 12px', textAlign: 'left' }}>{error}</p>}

      {!reminders ? (
        <p className="state-msg">불러오는 중...</p>
      ) : reminders.length === 0 ? (
        <p className="state-msg">아직 리마인더가 없습니다.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reminders.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: 8,
                borderLeft: `3px solid ${STATUS_COLOR[reminderStatus(r)]}`,
                background: 'var(--surface)',
              }}
            >
              <div>
                <div style={{ fontSize: 13 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {r.intervalDays}일마다 · {statusText(r)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => markDone(r.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>
                  완료
                </button>
                <button onClick={() => remove(r.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

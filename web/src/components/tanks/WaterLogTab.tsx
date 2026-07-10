import { useEffect, useState } from 'react';
import { addWaterLog, deleteWaterLog, listWaterLogs } from '../../lib/tanks';
import type { Tank, WaterLogEntry } from '../../lib/types';

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  width: '100%',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function parseFloatOrNull(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

export function WaterLogTab({ tank }: { tank: Tank }) {
  const [logs, setLogs] = useState<WaterLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(todayStr());
  const [temp, setTemp] = useState('');
  const [ph, setPh] = useState('');
  const [ammonia, setAmmonia] = useState('');
  const [nitrite, setNitrite] = useState('');
  const [nitrate, setNitrate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  function refresh() {
    listWaterLogs(tank.id)
      .then(setLogs)
      .catch((err: Error) => setError(err.message));
  }

  useEffect(refresh, [tank.id]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await addWaterLog(tank.id, {
        loggedAt: date,
        temp: parseFloatOrNull(temp),
        ph: parseFloatOrNull(ph),
        ammonia: parseFloatOrNull(ammonia),
        nitrite: parseFloatOrNull(nitrite),
        nitrate: parseFloatOrNull(nitrate),
        note: note.trim() || null,
      });
      setTemp('');
      setPh('');
      setAmmonia('');
      setNitrite('');
      setNitrate('');
      setNote('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteWaterLog(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8, marginBottom: 8 }}>
        <label style={{ fontSize: 11, color: 'var(--muted)' }}>
          날짜
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 11, color: 'var(--muted)' }}>
          수온(°C)
          <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 11, color: 'var(--muted)' }}>
          pH
          <input type="number" step="0.1" value={ph} onChange={(e) => setPh(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 11, color: 'var(--muted)' }}>
          암모니아(ppm)
          <input type="number" step="0.01" value={ammonia} onChange={(e) => setAmmonia(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 11, color: 'var(--muted)' }}>
          아질산(ppm)
          <input type="number" step="0.01" value={nitrite} onChange={(e) => setNitrite(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
        </label>
        <label style={{ fontSize: 11, color: 'var(--muted)' }}>
          질산염(ppm)
          <input type="number" step="1" value={nitrate} onChange={(e) => setNitrate(e.target.value)} style={{ ...inputStyle, marginTop: 4 }} />
        </label>
      </div>
      <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 10 }}>
        메모
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 30% 환수" style={{ ...inputStyle, marginTop: 4 }} />
      </label>

      <button
        onClick={submit}
        disabled={saving}
        style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#06201c', cursor: saving ? 'default' : 'pointer', marginBottom: 20 }}
      >
        기록 추가
      </button>

      {error && <p className="state-msg error" style={{ padding: '0 0 12px', textAlign: 'left' }}>{error}</p>}

      {!logs ? (
        <p className="state-msg">불러오는 중...</p>
      ) : logs.length === 0 ? (
        <p className="state-msg">아직 기록이 없습니다.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ color: 'var(--muted)', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>날짜</th>
                <th style={{ padding: '6px 8px' }}>수온</th>
                <th style={{ padding: '6px 8px' }}>pH</th>
                <th style={{ padding: '6px 8px' }}>암모니아</th>
                <th style={{ padding: '6px 8px' }}>아질산</th>
                <th style={{ padding: '6px 8px' }}>질산염</th>
                <th style={{ padding: '6px 8px' }}>메모</th>
                <th style={{ padding: '6px 8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {logs
                .slice()
                .reverse()
                .map((e) => (
                  <tr key={e.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 8px' }}>{e.loggedAt}</td>
                    <td style={{ padding: '6px 8px' }}>{e.temp ?? '-'}</td>
                    <td style={{ padding: '6px 8px' }}>{e.ph ?? '-'}</td>
                    <td style={{ padding: '6px 8px' }}>{e.ammonia ?? '-'}</td>
                    <td style={{ padding: '6px 8px' }}>{e.nitrite ?? '-'}</td>
                    <td style={{ padding: '6px 8px' }}>{e.nitrate ?? '-'}</td>
                    <td style={{ padding: '6px 8px' }}>{e.note ?? '-'}</td>
                    <td style={{ padding: '6px 8px' }}>
                      <button onClick={() => remove(e.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

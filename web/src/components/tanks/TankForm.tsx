import { useEffect, useMemo, useState } from 'react';
import type { ReferenceData } from '../../lib/referenceData';
import { createTank, deleteTank, listTankSpecies, setTankSpecies, updateTank } from '../../lib/tanks';
import type { Tank } from '../../lib/types';

interface ChipEntry {
  speciesId: string;
  count: number;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
};

export function TankForm({
  userId,
  existing,
  referenceData,
  onDone,
  onCancel,
}: {
  userId: string;
  existing: Tank | null;
  referenceData: ReferenceData;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? '');
  const [lengthCm, setLengthCm] = useState(existing?.lengthCm ?? 0);
  const [widthCm, setWidthCm] = useState(existing?.widthCm ?? 0);
  const [heightCm, setHeightCm] = useState(existing?.heightCm ?? 0);
  const [chips, setChips] = useState<ChipEntry[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    listTankSpecies(existing.id)
      .then((entries) => setChips(entries.map((e) => ({ speciesId: e.speciesId, count: e.count }))))
      .catch((err: Error) => setError(err.message));
  }, [existing]);

  const volumeL = Math.round((lengthCm * widthCm * heightCm) / 1000);

  const remaining = useMemo(() => {
    const chosen = new Set(chips.map((c) => c.speciesId));
    return referenceData.species.filter((s) => !chosen.has(s.id));
  }, [chips, referenceData]);

  function addSpecies(id: string) {
    setChips((prev) => [...prev, { speciesId: id, count: 1 }]);
  }
  function removeSpecies(id: string) {
    setChips((prev) => prev.filter((c) => c.speciesId !== id));
  }
  function setCount(id: string, count: number) {
    setChips((prev) => prev.map((c) => (c.speciesId === id ? { ...c, count: Math.max(1, count) } : c)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const finalName = name.trim() || '이름 없는 어항';
      let tankId = existing?.id;
      if (existing) {
        await updateTank(existing.id, { name: finalName, lengthCm, widthCm, heightCm, volumeL });
      } else {
        const created = await createTank({ userId, name: finalName, lengthCm, widthCm, heightCm, volumeL });
        tankId = created.id;
      }
      await setTankSpecies(tankId!, chips);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) return;
    setSaving(true);
    setError(null);
    try {
      await deleteTank(existing.id);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <div>
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, marginBottom: 16, fontSize: 13 }}>
        ← 목록으로
      </button>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{existing ? '어항 수정' : '어항 추가'}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--muted)' }}>
          어항 이름
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 거실 60cm 수조" style={{ ...inputStyle, marginTop: 4 }} />
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ fontSize: 12, color: 'var(--muted)', flex: 1 }}>
            가로(cm)
            <input type="number" value={lengthCm || ''} onChange={(e) => setLengthCm(parseFloat(e.target.value) || 0)} style={{ ...inputStyle, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: 'var(--muted)', flex: 1 }}>
            폭(cm)
            <input type="number" value={widthCm || ''} onChange={(e) => setWidthCm(parseFloat(e.target.value) || 0)} style={{ ...inputStyle, marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 12, color: 'var(--muted)', flex: 1 }}>
            높이(cm)
            <input type="number" value={heightCm || ''} onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)} style={{ ...inputStyle, marginTop: 4 }} />
          </label>
        </div>
        <div style={{ fontSize: 13, color: 'var(--teal)' }}>부피: {volumeL}L</div>
      </div>

      <label style={{ fontSize: 12, color: 'var(--muted)' }}>
        종 추가
        <select
          value=""
          onChange={(e) => e.target.value && addSpecies(e.target.value)}
          style={{ ...inputStyle, marginTop: 4, marginBottom: 12 }}
        >
          <option value="">선택하세요</option>
          {remaining.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.latin})
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {chips.map((c) => {
          const s = referenceData.species.find((sp) => sp.id === c.speciesId);
          if (!s) return null;
          return (
            <div
              key={c.speciesId}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13 }}
            >
              <span>{s.name}</span>
              <input
                type="number"
                min={1}
                value={c.count}
                onChange={(e) => setCount(c.speciesId, parseInt(e.target.value, 10) || 1)}
                style={{ width: 40, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', textAlign: 'center', padding: 2 }}
              />
              <span style={{ color: 'var(--muted)', fontSize: 11 }}>마리</span>
              <button onClick={() => removeSpecies(c.speciesId)} aria-label="remove" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0 }}>
                ×
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="state-msg error" style={{ padding: '0 0 12px', textAlign: 'left' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#06201c', cursor: saving ? 'default' : 'pointer' }}
        >
          {existing ? '저장' : '추가'}
        </button>
        {existing && !confirmingDelete && (
          <button
            onClick={() => setConfirmingDelete(true)}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--danger)', background: 'none', color: 'var(--danger)', cursor: 'pointer' }}
          >
            삭제
          </button>
        )}
        {existing && confirmingDelete && (
          <>
            <span style={{ fontSize: 13, color: 'var(--danger)', alignSelf: 'center' }}>이 어항을 삭제할까요? 수질 기록과 리마인더도 함께 삭제됩니다.</span>
            <button onClick={remove} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--danger)', background: 'var(--danger)', color: '#fff', cursor: 'pointer' }}>
              삭제 확인
            </button>
            <button onClick={() => setConfirmingDelete(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer' }}>
              취소
            </button>
          </>
        )}
      </div>
    </div>
  );
}

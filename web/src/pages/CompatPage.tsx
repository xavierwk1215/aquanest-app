import { useMemo, useState } from 'react';
import { useReferenceData } from '../hooks/useReferenceData';
import { computeCompat } from '../lib/compat';
import type { CompatResult, Species } from '../lib/types';

const VERDICT_LABEL: Record<0 | 1 | 2, { title: string; cls: string }> = {
  0: { title: '합사 적합', cls: 'ok' },
  1: { title: '주의 필요', cls: 'caution' },
  2: { title: '합사 비추천', cls: 'bad' },
};

const SEV_COLOR: Record<0 | 1 | 2, string> = {
  0: 'var(--teal)',
  1: 'var(--amber)',
  2: 'var(--danger)',
};

function SpeciesSelect({
  species,
  value,
  onChange,
  label,
}: {
  species: Species[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <label style={{ flex: 1, display: 'block', fontSize: 12, color: 'var(--muted)' }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          display: 'block',
          width: '100%',
          marginTop: 4,
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
        }}
      >
        <option value="">선택하세요</option>
        {species.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.latin})
          </option>
        ))}
      </select>
    </label>
  );
}

export function CompatPage() {
  const { data, loading, error } = useReferenceData();
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [result, setResult] = useState<CompatResult | null>(null);

  const speciesById = useMemo(() => {
    const map = new Map<string, Species>();
    data?.species.forEach((s) => map.set(s.id, s));
    return map;
  }, [data]);

  if (loading) return <p className="state-msg">불러오는 중...</p>;
  if (error) return <p className="state-msg error">데이터를 불러오지 못했습니다: {error}</p>;
  if (!data) return null;

  const sA = speciesById.get(idA);
  const sB = speciesById.get(idB);

  function check() {
    if (!sA || !sB || !data) return;
    setResult(computeCompat(sA, sB, data.careGroups, data.overrides));
  }

  const verdict = result ? VERDICT_LABEL[result.severity] : null;

  return (
    <div>
      <p className="state-msg" style={{ padding: 0, textAlign: 'left', marginBottom: 16 }}>
        두 어종을 선택하면 수온·pH 겹침, 성격, 크기 차이를 기준으로 합사 가능 여부를 확인해드려요.
      </p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16 }}>
        <SpeciesSelect species={data.species} value={idA} onChange={setIdA} label="어종 A" />
        <div style={{ paddingBottom: 10, color: 'var(--muted)' }}>×</div>
        <SpeciesSelect species={data.species} value={idB} onChange={setIdB} label="어종 B" />
      </div>
      <button
        onClick={check}
        disabled={!sA || !sB}
        style={{
          padding: '10px 20px',
          borderRadius: 8,
          border: 'none',
          background: sA && sB ? 'var(--teal)' : 'var(--surface-2)',
          color: sA && sB ? '#06201c' : 'var(--muted)',
          cursor: sA && sB ? 'pointer' : 'not-allowed',
        }}
      >
        합사 체크하기
      </button>

      {result && verdict && (
        <div
          style={{
            marginTop: 24,
            border: `1px solid ${SEV_COLOR[result.severity]}`,
            borderRadius: 12,
            padding: 16,
            background: 'var(--surface-2)',
          }}
        >
          <h2 style={{ margin: '0 0 4px', fontSize: 18, color: SEV_COLOR[result.severity] }}>{verdict.title}</h2>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--muted)' }}>
            권장 최소 어항: {result.tankMin}L
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.reasons.map((r, i) => (
              <li key={i} style={{ fontSize: 13, display: 'flex', gap: 8, lineHeight: 1.6 }}>
                <span style={{ color: SEV_COLOR[r.sev], flexShrink: 0 }}>{r.sev === 0 ? '✓' : r.sev === 1 ? '!' : '✕'}</span>
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { DualRangeBar } from '../components/DualRangeBar';
import { useReferenceData } from '../hooks/useReferenceData';
import { computeCompat, getSpec } from '../lib/compat';
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

// Fixed axis ranges for the dual bars, matching the original prototype
// (a bit wider than any single species' range so bars never clip).
const COMPAT_TEMP_RANGE: [number, number] = [8, 35];
const COMPAT_PH_RANGE: [number, number] = [4.0, 9.5];

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
  const fA = sA && data ? getSpec(sA, data.careGroups) : null;
  const fB = sB && data ? getSpec(sB, data.careGroups) : null;

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
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
            권장 최소 어항: {result.tankMin}L
          </p>

          {fA && fB && sA && sB && (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>수온</span>
                  <span style={{ color: 'var(--muted)' }}>
                    {fA.temp[0]}~{fA.temp[1]}°C vs {fB.temp[0]}~{fB.temp[1]}°C
                  </span>
                </div>
                <DualRangeBar
                  rangeA={fA.temp}
                  rangeB={fB.temp}
                  overlap={result.tempOverlap}
                  min={COMPAT_TEMP_RANGE[0]}
                  max={COMPAT_TEMP_RANGE[1]}
                  colorA={fA.color}
                  colorB={fB.color}
                />
                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  <Legend color={fA.color} label={sA.name} />
                  <Legend color={fB.color} label={sB.name} />
                  <Legend color="var(--teal)" label="공통 구간" opacity={0.5} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span>pH</span>
                  <span style={{ color: 'var(--muted)' }}>
                    {fA.ph[0]}~{fA.ph[1]} vs {fB.ph[0]}~{fB.ph[1]}
                  </span>
                </div>
                <DualRangeBar
                  rangeA={fA.ph}
                  rangeB={fB.ph}
                  overlap={result.phOverlap}
                  min={COMPAT_PH_RANGE[0]}
                  max={COMPAT_PH_RANGE[1]}
                  colorA={fA.color}
                  colorB={fB.color}
                />
              </div>
            </>
          )}

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

function Legend({ color, label, opacity }: { color: string; label: string; opacity?: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, opacity, display: 'inline-block' }} />
      {label}
    </span>
  );
}

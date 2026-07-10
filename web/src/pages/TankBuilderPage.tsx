import { useMemo, useState } from 'react';
import { useReferenceData } from '../hooks/useReferenceData';
import { computeTankCheck } from '../lib/compat';
import type { Species, TankCheckResult } from '../lib/types';

const VERDICT_LABEL: Record<0 | 1 | 2, { title: string; sub: string }> = {
  0: { title: '전체 합사 적합', sub: '모든 조합이 무난하게 맞습니다.' },
  1: { title: '주의 필요', sub: '몇몇 조합에 신경 쓸 부분이 있습니다.' },
  2: { title: '합사 비추천 조합 있음', sub: '함께 키우기 어려운 조합이 있습니다.' },
};

const SEV_COLOR: Record<0 | 1 | 2, string> = {
  0: 'var(--teal)',
  1: 'var(--amber)',
  2: 'var(--danger)',
};

export function TankBuilderPage() {
  const { data, loading, error } = useReferenceData();
  const [selected, setSelected] = useState<Species[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [result, setResult] = useState<TankCheckResult | null>(null);

  const remaining = useMemo(() => {
    if (!data) return [];
    const chosen = new Set(selected.map((s) => s.id));
    return data.species.filter((s) => !chosen.has(s.id));
  }, [data, selected]);

  const totalCount = selected.reduce((sum, s) => sum + (counts[s.id] ?? 1), 0);

  if (loading) return <p className="state-msg">불러오는 중...</p>;
  if (error) return <p className="state-msg error">데이터를 불러오지 못했습니다: {error}</p>;
  if (!data) return null;

  function addSpecies(id: string) {
    const s = data!.species.find((sp) => sp.id === id);
    if (s) {
      setSelected((prev) => [...prev, s]);
      setCounts((prev) => ({ ...prev, [id]: 1 }));
    }
    setResult(null);
  }

  function removeSpecies(id: string) {
    setSelected((prev) => prev.filter((s) => s.id !== id));
    setResult(null);
  }

  function setCount(id: string, count: number) {
    setCounts((prev) => ({ ...prev, [id]: Math.max(1, count) }));
  }

  function check() {
    if (selected.length < 2 || !data) return;
    setResult(computeTankCheck(selected, data.careGroups, data.overrides));
  }

  return (
    <div>
      <p className="state-msg" style={{ padding: 0, textAlign: 'left', marginBottom: 16 }}>
        어항에 넣을 어종을 여러 마리 추가하면, 모든 종 쌍을 비교해 전체 합사 가능 여부를 확인해드려요.
      </p>

      <select
        value=""
        onChange={(e) => e.target.value && addSpecies(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          marginBottom: 12,
        }}
      >
        <option value="">+ 종 추가</option>
        {remaining.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.latin})
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {selected.map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              fontSize: 13,
            }}
          >
            <span>{s.name}</span>
            <input
              type="number"
              min={1}
              value={counts[s.id] ?? 1}
              onChange={(e) => setCount(s.id, parseInt(e.target.value, 10) || 1)}
              aria-label={`${s.name} 마릿수`}
              style={{ width: 40, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', textAlign: 'center', padding: 2 }}
            />
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>마리</span>
            <button
              onClick={() => removeSpecies(s.id)}
              aria-label="remove"
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, fontSize: 14 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={check}
        disabled={selected.length < 2}
        style={{
          padding: '10px 20px',
          borderRadius: 8,
          border: 'none',
          background: selected.length >= 2 ? 'var(--teal)' : 'var(--surface-2)',
          color: selected.length >= 2 ? '#06201c' : 'var(--muted)',
          cursor: selected.length >= 2 ? 'pointer' : 'not-allowed',
        }}
      >
        어항 구성 체크하기
      </button>
      {selected.length < 2 && (
        <p className="state-msg" style={{ padding: '8px 0 0', textAlign: 'left' }}>
          2종 이상 추가해야 체크할 수 있어요.
        </p>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              border: `1px solid ${SEV_COLOR[result.worst]}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              background: 'var(--surface-2)',
            }}
          >
            <div style={{ color: SEV_COLOR[result.worst], fontSize: 20 }}>
              {result.worst === 0 ? '✓' : result.worst === 1 ? '!' : '✕'}
            </div>
            <div>
              <div style={{ fontSize: 16, color: SEV_COLOR[result.worst] }}>{VERDICT_LABEL[result.worst].title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{VERDICT_LABEL[result.worst].sub}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 20 }}>
            <Fact label="공통 수온" value={result.combinedTemp ? `${result.combinedTemp[0]}~${result.combinedTemp[1]}°C` : '겹치는 구간 없음'} />
            <Fact label="공통 pH" value={result.combinedPh ? `${result.combinedPh[0].toFixed(1)}~${result.combinedPh[1].toFixed(1)}` : '겹치는 구간 없음'} />
            <Fact label="권장 최소 어항" value={`${result.recommendedTank}L 이상`} />
            <Fact label="비교한 쌍" value={`${result.pairs.length}쌍 (${selected.length}종)`} />
            <Fact label="총 마릿수" value={`${totalCount}마리`} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: -12, marginBottom: 20 }}>
            마릿수는 표시용이며, 종 쌍 궁합 판정에는 반영되지 않습니다.
          </p>

          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>종 쌍 상세</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.pairs
              .slice()
              .sort((a, b) => b.result.severity - a.result.severity)
              .map((p, i) => {
                const notable = p.result.reasons.filter((r) => r.sev >= 1).map((r) => r.text);
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${SEV_COLOR[p.result.severity]}`,
                      background: 'var(--surface)',
                    }}
                  >
                    <div style={{ color: SEV_COLOR[p.result.severity], flexShrink: 0 }}>
                      {p.result.severity === 0 ? '✓' : p.result.severity === 1 ? '!' : '✕'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13 }}>
                        {p.a.name} × {p.b.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        {notable.length ? notable.join(' · ') : '특별히 주의할 점 없음'}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
      <div style={{ fontSize: 14, marginTop: 2 }}>{value}</div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { computeTankCheck, getSpec } from '../../lib/compat';
import type { ReferenceData } from '../../lib/referenceData';
import { listTankSpecies } from '../../lib/tanks';
import type { Species, Tank } from '../../lib/types';

const SEV_COLOR: Record<0 | 1 | 2, string> = {
  0: 'var(--teal)',
  1: 'var(--amber)',
  2: 'var(--danger)',
};

export function StockingTab({ tank, referenceData }: { tank: Tank; referenceData: ReferenceData }) {
  const [entries, setEntries] = useState<{ species: Species; count: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTankSpecies(tank.id)
      .then((rows) => {
        const resolved = rows
          .map((r) => {
            const s = referenceData.species.find((sp) => sp.id === r.speciesId);
            return s ? { species: s, count: r.count } : null;
          })
          .filter((x): x is { species: Species; count: number } => x !== null);
        setEntries(resolved);
      })
      .catch((err: Error) => setError(err.message));
  }, [tank.id, referenceData]);

  if (error) return <p className="state-msg error">{error}</p>;
  if (!entries) return <p className="state-msg">불러오는 중...</p>;
  if (entries.length === 0) return <p className="state-msg">등록된 종이 없습니다. 어항 수정에서 종을 추가하세요.</p>;

  const totalCount = entries.reduce((sum, e) => sum + e.count, 0);
  const recommendedTank = Math.max(...entries.map((e) => getSpec(e.species, referenceData.careGroups).tankMin));
  const utilization = Math.min(100, Math.round((tank.volumeL / recommendedTank) * 100));
  const barColor = tank.volumeL >= recommendedTank ? 'var(--teal)' : 'var(--danger)';

  const check = entries.length >= 2 ? computeTankCheck(entries.map((e) => e.species), referenceData.careGroups, referenceData.overrides) : null;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Fact label="현재 부피" value={`${tank.volumeL}L`} />
        <Fact label="권장 최소" value={`${recommendedTank}L`} />
        <Fact label="총 마릿수" value={`${totalCount}마리`} />
      </div>

      <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${utilization}%`, background: barColor }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
        {tank.volumeL >= recommendedTank ? '어항 크기가 충분합니다.' : `권장 최소 부피보다 ${recommendedTank - tank.volumeL}L 부족합니다.`}
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>등록된 어종 ({entries.length}종 · {totalCount}마리)</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {entries.map((e) => (
          <div key={e.species.id} style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13 }}>
            {e.species.name} ×{e.count}
          </div>
        ))}
      </div>

      {check && (
        <>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>종 쌍 궁합</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {check.pairs
              .slice()
              .sort((a, b) => b.result.severity - a.result.severity)
              .map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 8, border: `1px solid ${SEV_COLOR[p.result.severity]}`, background: 'var(--surface)' }}>
                  <span style={{ color: SEV_COLOR[p.result.severity] }}>{p.result.severity === 0 ? '✓' : p.result.severity === 1 ? '!' : '✕'}</span>
                  <span style={{ fontSize: 13 }}>
                    {p.a.name} × {p.b.name}
                  </span>
                </div>
              ))}
          </div>
        </>
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

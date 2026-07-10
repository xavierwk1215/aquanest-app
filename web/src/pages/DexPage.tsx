import { useMemo, useState } from 'react';
import { useReferenceData } from '../hooks/useReferenceData';
import type { CareGroup, Species } from '../lib/types';

function getSpec(s: Species, careGroups: Record<string, CareGroup>): CareGroup {
  return careGroups[s.groupId];
}

function temperamentLabel(t: string): string {
  return ({ peaceful: '온순함', 'semi-aggressive': '약간 공격적', aggressive: '공격적' } as Record<string, string>)[t] || t;
}

type TankSizeFilter = 'all' | 'small' | 'medium' | 'large';
type PhFilter = 'all' | 'acidic' | 'neutral' | 'alkaline';

function tankCategory(tankMin: number): TankSizeFilter {
  if (tankMin <= 40) return 'small';
  if (tankMin <= 150) return 'medium';
  return 'large';
}

// pH range that counts as a match for each bucket. A species matches if its
// [ph_min, ph_max] range overlaps this bucket's range at all.
const PH_BUCKETS: Record<Exclude<PhFilter, 'all'>, [number, number]> = {
  acidic: [0, 6.5],
  neutral: [6.5, 7.5],
  alkaline: [7.5, 14],
};

function overlaps(a: [number, number], b: [number, number]): boolean {
  return a[0] <= b[1] && b[0] <= a[1];
}

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
};

export function DexPage() {
  const { data, loading, error } = useReferenceData();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState('all');
  const [tankSize, setTankSize] = useState<TankSizeFilter>('all');
  const [temperament, setTemperament] = useState('all');
  const [ph, setPh] = useState<PhFilter>('all');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.species.filter((s) => {
      const spec = getSpec(s, data.careGroups);
      if (!spec) return false;
      const matchesQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.nameEn ?? '').toLowerCase().includes(q) ||
        s.latin.toLowerCase().includes(q) ||
        s.aliases.some((a) => a.toLowerCase().includes(q));
      const matchesDifficulty = difficulty === 'all' || spec.difficulty === difficulty;
      const matchesTankSize = tankSize === 'all' || tankCategory(spec.tankMin) === tankSize;
      const matchesTemperament = temperament === 'all' || spec.temperament === temperament;
      const matchesPh = ph === 'all' || overlaps(spec.ph, PH_BUCKETS[ph]);
      return matchesQ && matchesDifficulty && matchesTankSize && matchesTemperament && matchesPh;
    });
  }, [data, query, difficulty, tankSize, temperament, ph]);

  if (loading) return <p className="state-msg">불러오는 중...</p>;
  if (error) return <p className="state-msg error">데이터를 불러오지 못했습니다: {error}</p>;
  if (!data) return null;

  const selected = selectedId ? (filtered.find((s) => s.id === selectedId) ?? null) : null;
  const spec = selected ? getSpec(selected, data.careGroups) : null;

  return (
    <div>
      <input
        type="text"
        placeholder="종 이름, 학명, 유통명으로 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          marginBottom: 10,
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={selectStyle}>
          <option value="all">사육난이도: 전체</option>
          <option value="초급">초급</option>
          <option value="중급">중급</option>
          <option value="고급">고급</option>
        </select>
        <select value={tankSize} onChange={(e) => setTankSize(e.target.value as TankSizeFilter)} style={selectStyle}>
          <option value="all">수조크기: 전체</option>
          <option value="small">소형 (~40L)</option>
          <option value="medium">중형 (41~150L)</option>
          <option value="large">대형 (151L~)</option>
        </select>
        <select value={temperament} onChange={(e) => setTemperament(e.target.value)} style={selectStyle}>
          <option value="all">사나운 정도: 전체</option>
          <option value="peaceful">온순함</option>
          <option value="semi-aggressive">약간 공격적</option>
          <option value="aggressive">공격적</option>
        </select>
        <select value={ph} onChange={(e) => setPh(e.target.value as PhFilter)} style={selectStyle}>
          <option value="all">pH: 전체</option>
          <option value="acidic">산성 (~6.5)</option>
          <option value="neutral">중성 (6.5~7.5)</option>
          <option value="alkaline">알칼리성 (7.5~)</option>
        </select>
      </div>

      {selected && spec && (
        <div style={{ border: '1px solid var(--teal)', borderRadius: 12, padding: 16, background: 'var(--surface-2)', marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 2px', fontSize: 16 }}>{selected.name}</h2>
          <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: 12, marginBottom: 12 }}>{selected.latin}</div>
          <dl style={{ display: 'grid', gridTemplateColumns: '100px 1fr', rowGap: 6, columnGap: 8, fontSize: 13, margin: 0 }}>
            <dt style={{ color: 'var(--muted)' }}>수온</dt>
            <dd style={{ margin: 0 }}>{spec.temp[0]}~{spec.temp[1]}°C</dd>
            <dt style={{ color: 'var(--muted)' }}>pH</dt>
            <dd style={{ margin: 0 }}>{spec.ph[0]}~{spec.ph[1]}</dd>
            <dt style={{ color: 'var(--muted)' }}>최소 어항</dt>
            <dd style={{ margin: 0 }}>{spec.tankMin}L</dd>
            <dt style={{ color: 'var(--muted)' }}>최대 크기</dt>
            <dd style={{ margin: 0 }}>{selected.maxSize}cm</dd>
            <dt style={{ color: 'var(--muted)' }}>성격</dt>
            <dd style={{ margin: 0 }}>{temperamentLabel(spec.temperament)}</dd>
            <dt style={{ color: 'var(--muted)' }}>먹이</dt>
            <dd style={{ margin: 0 }}>{spec.diet}</dd>
          </dl>
          <p style={{ fontSize: 13, marginTop: 12, marginBottom: 0, lineHeight: 1.6 }}>{spec.tips}</p>
        </div>
      )}

      <p className="state-msg" style={{ padding: 0, textAlign: 'left', marginBottom: 12 }}>
        {filtered.length}종 (클릭하면 위에 상세 정보가 표시됩니다)
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 20 }}>
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId((prev) => (prev === s.id ? null : s.id))}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${selected?.id === s.id ? 'var(--teal)' : 'var(--border)'}`,
              background: 'var(--surface)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 13 }}>{s.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>{s.latin}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

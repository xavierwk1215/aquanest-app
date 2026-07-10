import { useMemo, useState } from 'react';
import { useReferenceData } from '../hooks/useReferenceData';
import type { CareGroup, Species } from '../lib/types';

function getSpec(s: Species, careGroups: Record<string, CareGroup>): CareGroup {
  return careGroups[s.groupId];
}

export function DexPage() {
  const { data, loading, error } = useReferenceData();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.species;
    return data.species.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.nameEn ?? '').toLowerCase().includes(q) ||
        s.latin.toLowerCase().includes(q) ||
        s.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }, [data, query]);

  if (loading) return <p className="state-msg">불러오는 중...</p>;
  if (error) return <p className="state-msg error">데이터를 불러오지 못했습니다: {error}</p>;
  if (!data) return null;

  const selected = filtered.find((s) => s.id === selectedId) ?? filtered[0] ?? null;
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
          marginBottom: 16,
        }}
      />
      <p className="state-msg" style={{ padding: 0, textAlign: 'left', marginBottom: 12 }}>
        {filtered.length}종
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 20 }}>
        {filtered.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedId(s.id)}
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

      {selected && spec && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface-2)' }}>
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
            <dd style={{ margin: 0 }}>{spec.temperament}</dd>
            <dt style={{ color: 'var(--muted)' }}>먹이</dt>
            <dd style={{ margin: 0 }}>{spec.diet}</dd>
          </dl>
          <p style={{ fontSize: 13, marginTop: 12, marginBottom: 0, lineHeight: 1.6 }}>{spec.tips}</p>
        </div>
      )}
    </div>
  );
}

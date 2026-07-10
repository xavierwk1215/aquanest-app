// Ported from app/index.html's renderDualBar: shows two species' ranges
// (temp or pH) on a shared track with the overlap highlighted.
export function DualRangeBar({
  rangeA,
  rangeB,
  overlap,
  min,
  max,
  colorA,
  colorB,
}: {
  rangeA: [number, number];
  rangeB: [number, number];
  overlap: [number, number] | null;
  min: number;
  max: number;
  colorA: string;
  colorB: string;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const aLeft = pct(rangeA[0]);
  const aWidth = pct(rangeA[1]) - aLeft;
  const bLeft = pct(rangeB[0]);
  const bWidth = pct(rangeB[1]) - bLeft;
  const ovLeft = overlap ? pct(overlap[0]) : 0;
  const ovWidth = overlap ? pct(overlap[1]) - ovLeft : 0;

  return (
    <div style={{ height: 22, borderRadius: 6, background: 'var(--surface-2)', position: 'relative', overflow: 'hidden' }}>
      {overlap && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${ovLeft}%`,
            width: `${ovWidth}%`,
            background: 'rgba(56,182,163,.28)',
            borderLeft: '1px dashed var(--teal)',
            borderRight: '1px dashed var(--teal)',
          }}
        />
      )}
      <div style={{ position: 'absolute', height: 8, borderRadius: 4, top: 2, left: `${aLeft}%`, width: `${aWidth}%`, background: colorA }} />
      <div style={{ position: 'absolute', height: 8, borderRadius: 4, top: 12, left: `${bLeft}%`, width: `${bWidth}%`, background: colorB }} />
    </div>
  );
}

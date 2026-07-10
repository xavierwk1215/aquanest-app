// 합사 판정 엔진 v2 — 숫자 합산 대신 카테고리 매트릭스 + 단계적
// 다운그레이드 규칙으로 처리 (설명 가능한 구조 유지가 목적)
//
// Ported 1:1 from app/index.html's computeCompat (same rule order, same
// severity math, same Korean copy) so the judgments this produces are
// identical to the original prototype. If you need to change wording or
// rules, change them here — app/index.html is now legacy reference only.

import type { CareGroup, CompatResult, Species, SpeciesPairOverride, TankCheckResult, Verdict } from './types';

function overlapRange(a: [number, number], b: [number, number]): [number, number] | null {
  const lo = Math.max(a[0], b[0]);
  const hi = Math.min(a[1], b[1]);
  return lo <= hi ? [lo, hi] : null;
}

// 2단계: 성격 x 성격 매트릭스. 'conditional'은 동종 여부로 갈림.
const TEMPERAMENT_MATRIX: Record<string, Record<string, Verdict | 'conditional'>> = {
  peaceful: { peaceful: 'ok', 'semi-aggressive': 'caution', aggressive: 'bad' },
  'semi-aggressive': { peaceful: 'caution', 'semi-aggressive': 'caution', aggressive: 'bad' },
  aggressive: { peaceful: 'bad', 'semi-aggressive': 'bad', aggressive: 'conditional' },
};

const VERDICT_SEV: Record<Verdict, 0 | 1 | 2> = { ok: 0, caution: 1, bad: 2 };

function temperamentLabel(t: string): string {
  return ({ peaceful: '온순함', 'semi-aggressive': '약간 공격적', aggressive: '공격적' } as Record<string, string>)[t] || t;
}

function dietCategory(diet: string): 'herbivore' | 'carnivore' | 'omnivore' {
  if (diet.includes('초식')) return 'herbivore';
  if (diet.includes('육식')) return 'carnivore';
  return 'omnivore';
}

function findOverride(sA: Species, sB: Species, overrides: SpeciesPairOverride[]): SpeciesPairOverride | undefined {
  return overrides.find(
    (o) => (o.speciesA === sA.id && o.speciesB === sB.id) || (o.speciesA === sB.id && o.speciesB === sA.id)
  );
}

// Merge group-level care spec with species-level identity fields.
// Species-level fields (if present) override group defaults.
export function getSpec(s: Species, careGroups: Record<string, CareGroup>): CareGroup & Species {
  return { ...careGroups[s.groupId], ...s };
}

interface CompatState {
  severity: 0 | 1 | 2;
  reasons: { sev: 0 | 1 | 2; text: string }[];
}

// 단계적 다운그레이드 유틸: severity를 최대 1단계씩만 올리고 이유를 기록
function makeDowngrader(state: CompatState) {
  return (text: string) => {
    state.severity = Math.min(2, state.severity + 1) as 0 | 1 | 2;
    state.reasons.push({ sev: 1, text });
  };
}

export function computeCompat(
  sA: Species,
  sB: Species,
  careGroups: Record<string, CareGroup>,
  overrides: SpeciesPairOverride[] = []
): CompatResult {
  const fA = getSpec(sA, careGroups);
  const fB = getSpec(sB, careGroups);
  const state: CompatState = { severity: 0, reasons: [] };
  const downgrade = makeDowngrader(state);

  if (sA.id === sB.id) {
    state.reasons.push({
      sev: 0,
      text: fA.schooling.need
        ? `같은 종입니다. 무리 사육이 필요한 종이라 최소 ${fA.schooling.minGroup}마리 이상 함께 키우는 걸 권장합니다.`
        : `같은 종입니다. 단독 사육도 가능한 종입니다.`,
    });
    return { severity: 0, reasons: state.reasons, tempOverlap: fA.temp, phOverlap: fA.ph, tankMin: fA.tankMin };
  }

  // ---- 1단계: 하드 블로커 (수온/pH 겹침 — 숫자라서 계산 가능한 영역) ----
  const tempOv = overlapRange(fA.temp, fB.temp);
  if (!tempOv) {
    state.severity = 2;
    state.reasons.push({
      sev: 2,
      text: `수온 범위가 겹치지 않습니다 (${fA.temp[0]}~${fA.temp[1]}°C vs ${fB.temp[0]}~${fB.temp[1]}°C). 두 종을 동시에 만족시키는 온도를 만들 수 없습니다.`,
    });
  } else if (tempOv[1] - tempOv[0] < 1.5) {
    state.severity = Math.max(state.severity, 1) as 0 | 1 | 2;
    state.reasons.push({
      sev: 1,
      text: `수온이 겹치긴 하지만 공통 구간이 좁습니다 (공통: ${tempOv[0]}~${tempOv[1]}°C). 온도 유지에 신경 써야 합니다.`,
    });
  } else {
    state.reasons.push({ sev: 0, text: `수온 범위가 잘 겹칩니다 (공통: ${tempOv[0]}~${tempOv[1]}°C).` });
  }

  const phOv = overlapRange(fA.ph, fB.ph);
  if (!phOv) {
    state.severity = 2;
    state.reasons.push({
      sev: 2,
      text: `pH 범위가 겹치지 않습니다 (${fA.ph[0]}~${fA.ph[1]} vs ${fB.ph[0]}~${fB.ph[1]}). 두 종에게 동시에 맞는 수질을 유지하기 어렵습니다.`,
    });
  } else if (phOv[1] - phOv[0] < 0.3) {
    state.severity = Math.max(state.severity, 1) as 0 | 1 | 2;
    state.reasons.push({
      sev: 1,
      text: `pH가 겹치긴 하지만 공통 구간이 좁습니다 (공통: ${phOv[0].toFixed(1)}~${phOv[1].toFixed(1)}).`,
    });
  } else {
    state.reasons.push({ sev: 0, text: `pH 범위가 잘 겹칩니다 (공통: ${phOv[0].toFixed(1)}~${phOv[1].toFixed(1)}).` });
  }

  // ---- 2단계: 성격 매트릭스 (정성 데이터는 카테고리 교차표로만 처리) ----
  const bigMax = Math.max(sA.maxSize, sB.maxSize);
  const smallMax = Math.min(sA.maxSize, sB.maxSize);
  const sizeRatio = bigMax / smallMax;

  let tVerdict: Verdict | 'conditional' = TEMPERAMENT_MATRIX[fA.temperament][fB.temperament];
  if (tVerdict === 'conditional') {
    tVerdict = sA.groupId === sB.groupId ? 'caution' : 'bad';
    state.reasons.push({
      sev: VERDICT_SEV[tVerdict],
      text:
        tVerdict === 'caution'
          ? `둘 다 공격적인 성향이지만 같은 케어그룹(비슷한 생태)이라 무리 사육 형태로는 가능할 수 있습니다.`
          : `둘 다 공격적인 성향이고 생태가 달라 서로 충돌할 가능성이 큽니다.`,
    });
  } else if (tVerdict === 'bad' && sizeRatio < 1.8) {
    // '*' 조건: 크기가 비슷하면 완화
    tVerdict = 'caution';
    state.reasons.push({
      sev: 1,
      text: `성격 조합상으로는 위험하지만(${temperamentLabel(fA.temperament)} vs ${temperamentLabel(fB.temperament)}), 크기가 비슷해(${bigMax}cm vs ${smallMax}cm) 위험도가 다소 낮아집니다.`,
    });
  } else {
    const labelMap: Record<Verdict, string> = {
      ok: '좋은 궁합입니다.',
      caution: '차이가 있어 은신처를 넉넉히 두는 게 안전합니다.',
      bad: '한쪽이 다른 쪽을 괴롭히거나 공격할 위험이 큽니다.',
    };
    state.reasons.push({
      sev: VERDICT_SEV[tVerdict],
      text: `성격: ${temperamentLabel(fA.temperament)} vs ${temperamentLabel(fB.temperament)} — ${labelMap[tVerdict]}`,
    });
  }
  state.severity = Math.max(state.severity, VERDICT_SEV[tVerdict]) as 0 | 1 | 2;

  // 크기 차이에 따른 포식 위험 (매트릭스와 별개로, 온순한 조합이어도 크기 차가 크면 위험)
  if (sizeRatio >= 4) {
    state.severity = 2;
    state.reasons.push({
      sev: 2,
      text: `크기 차이가 매우 큽니다 (${bigMax}cm vs ${smallMax}cm). 성격과 무관하게 큰 종이 작은 종을 먹이로 인식할 위험이 있습니다.`,
    });
  } else if (sizeRatio >= 2.5 && tVerdict === 'ok') {
    downgrade(`크기 차이가 있는 편입니다 (${bigMax}cm vs ${smallMax}cm). 작은 개체가 스트레스를 받을 수 있어 관찰이 필요합니다.`);
  }

  // ---- 3단계: 보조 리스크 요인 (등급을 한 단계씩만 낮추는 규칙) ----
  const predatorSpecies = fA.predatory ? sA : fB.predatory ? sB : null;
  const preySpecies = predatorSpecies === sA ? sB : sA;
  if (predatorSpecies && preySpecies.maxSize * 2.5 <= predatorSpecies.maxSize) {
    state.severity = 2;
    state.reasons.push({
      sev: 2,
      text: `[${predatorSpecies.name}]은(는) 입에 들어가는 크기의 물고기를 먹이로 인식하는 습성이 있어, 몸집이 작은 [${preySpecies.name}]은(는) 잡아먹힐 위험이 있습니다.`,
    });
  } else if (predatorSpecies) {
    downgrade(`[${predatorSpecies.name}]은(는) 포식성 습성이 있는 종입니다. 크기가 비슷해도 관찰이 필요합니다.`);
  }

  if (fA.finNipper || fB.finNipper) {
    const nipper = fA.finNipper ? sA : sB;
    downgrade(`[${nipper.name}]은(는) 지느러미를 무는 습성이 있어, 베타나 구라미처럼 지느러미가 화려하고 긴 어종과는 합사에 주의가 필요합니다.`);
  }

  if (fA.territorial && fB.territorial) {
    downgrade(`두 종 다 영역성이 있어 은신처와 시야를 가릴 수 있는 구조물을 넉넉히 배치하는 게 안전합니다.`);
  }

  // 같은 수층 + 같은 식성 카테고리 = 니치 경쟁
  if (fA.waterLevel === fB.waterLevel && dietCategory(fA.diet) === dietCategory(fB.diet)) {
    downgrade(`두 종이 같은 수층(${fA.waterLevel})에서 비슷한 먹이를 두고 경쟁할 수 있습니다. 급여 시 양쪽에 먹이가 고루 돌아가는지 확인하세요.`);
  }

  // 수질 예민도 — 예민한 종이 거친 tankmate나 큰 바이오로드에 노출되는 경우
  const sensitiveSpecies = fA.waterSensitivity === 'high' ? sA : fB.waterSensitivity === 'high' ? sB : null;
  if (sensitiveSpecies) {
    const other = sensitiveSpecies === sA ? fB : fA;
    const otherSp = sensitiveSpecies === sA ? sB : sA;
    if (other.temperament !== 'peaceful' || otherSp.maxSize >= 30) {
      downgrade(
        `[${sensitiveSpecies.name}]은(는) 수질 변화에 예민한 종입니다. 거칠거나 몸집이 큰 [${otherSp.name}]과 함께 두면 스트레스를 받기 쉬워 수조가 충분히 안정된 뒤 입식하는 걸 권장합니다.`
      );
    } else {
      state.reasons.push({
        sev: 0,
        text: `[${sensitiveSpecies.name}]은(는) 수질 변화에 예민한 종이니, 어떤 조합이든 수조가 충분히 안정된 뒤에 입식하세요.`,
      });
    }
  }

  // 정보성 참고사항 (등급에는 영향 없음 — 실제 마리 수를 모르기 때문)
  if (fA.sameSpeciesAggressionOnly && fB.sameSpeciesAggressionOnly && sA.groupId === sB.groupId) {
    state.reasons.push({ sev: 0, text: `두 종 모두 동종끼리 공격성이 강해지는 습성이 있습니다. 수컷 수 조절이 중요합니다.` });
  }
  if (fA.breedingAggressionOnly || fB.breedingAggressionOnly) {
    const breeder = fA.breedingAggressionOnly ? sA : sB;
    state.reasons.push({
      sev: 0,
      text: `[${breeder.name}]은(는) 평상시엔 문제없지만 번식기/산란기에는 일시적으로 공격성이 크게 올라갈 수 있습니다.`,
    });
  }
  if (fA.schooling.need || fB.schooling.need) {
    const schooler = fA.schooling.need ? sA : sB;
    const need = fA.schooling.need ? fA.schooling.minGroup : fB.schooling.minGroup;
    state.reasons.push({
      sev: 0,
      text: `[${schooler.name}]은(는) 무리 사육이 필요한 종입니다 (최소 ${need}마리). 마리 수가 부족하면 스트레스로 공격성이 오히려 올라갈 수 있어요.`,
    });
  }

  const brackishGroups = ['puffer-brackish', 'brackish-shark-catfish'];
  if (brackishGroups.includes(sA.groupId) || brackishGroups.includes(sB.groupId)) {
    downgrade(`한쪽은 성장하면서 기수(약간의 염분)가 필요해지는 종입니다. 완전 담수 전용종과는 장기적으로 합사가 어려울 수 있습니다.`);
  }
  if (sA.groupId === 'piranha' || sB.groupId === 'piranha') {
    state.severity = 2;
    state.reasons.push({ sev: 2, text: `피라냐는 원칙적으로 동종 무리 외에는 다른 어종과 합사가 거의 불가능합니다.` });
  }
  if (sA.groupId === 'pacu' || sB.groupId === 'pacu') {
    downgrade(`파쿠는 성장하면 90cm 가까이 자라는 대형 초식어라, 결국 수조 크기 문제로 대부분의 소형 어종과 합사가 어려워집니다.`);
  }
  if (sA.note) state.reasons.push({ sev: 1, text: `[${sA.name}] ${sA.note}` });
  if (sB.note) state.reasons.push({ sev: 1, text: `[${sB.name}] ${sB.note}` });

  // ---- 예외 테이블 — 규칙 기반 결론을 실제 사례로 덮어씀 ----
  const override = findOverride(sA, sB, overrides);
  if (override) {
    state.severity = VERDICT_SEV[override.result];
    state.reasons.unshift({
      sev: VERDICT_SEV[override.result],
      text: `[알려진 예외 사례 · 출처: ${override.source}] ${override.reason}`,
    });
  }

  return {
    severity: state.severity,
    reasons: state.reasons,
    tempOverlap: tempOv,
    phOverlap: phOv,
    tankMin: Math.max(fA.tankMin, fB.tankMin),
  };
}

// 어항 구성 체크 (3종 이상 한번에) — 기존 2종 비교 엔진을 재사용해서
// 모든 종 쌍(pair)을 다 비교하고, 그중 가장 심각한 결과를 대표값으로 씀
export function computeTankCheck(
  list: Species[],
  careGroups: Record<string, CareGroup>,
  overrides: SpeciesPairOverride[] = []
): TankCheckResult {
  const pairs = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      pairs.push({ a: list[i], b: list[j], result: computeCompat(list[i], list[j], careGroups, overrides) });
    }
  }
  const worst = (pairs.length ? Math.max(...pairs.map((p) => p.result.severity)) : 0) as 0 | 1 | 2;

  let combinedTemp: [number, number] | null = getSpec(list[0], careGroups).temp;
  let combinedPh: [number, number] | null = getSpec(list[0], careGroups).ph;
  list.slice(1).forEach((s) => {
    const f = getSpec(s, careGroups);
    combinedTemp = combinedTemp ? overlapRange(combinedTemp, f.temp) : null;
    combinedPh = combinedPh ? overlapRange(combinedPh, f.ph) : null;
  });

  const recommendedTank = Math.max(...list.map((s) => getSpec(s, careGroups).tankMin));
  return { pairs, worst, combinedTemp, combinedPh, recommendedTank };
}

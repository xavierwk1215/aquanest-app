import { isSupabaseConfigured, supabase } from './supabase';
import type { CareGroup, Species, SpeciesPairOverride } from './types';

export interface ReferenceData {
  careGroups: Record<string, CareGroup>;
  species: Species[];
  overrides: SpeciesPairOverride[];
}

// Known real-world exceptions the rule engine can't derive on its own.
// Used only in local-fallback mode; once Supabase is configured this comes
// from the species_pair_overrides table (seeded via
// scripts/generate_supabase_seed.mjs, which is the source of truth these
// must stay in sync with).
const LOCAL_PAIR_OVERRIDES: SpeciesPairOverride[] = [
  {
    speciesA: 'betta',
    speciesB: 'corydoras',
    result: 'caution',
    reason:
      '베타는 하층에서 조용히 지내는 코리도라스는 대체로 무시하는 편이라 실제로 널리 쓰이는 조합입니다. 다만 베타 개체 성격 차이가 커서 완전히 안전하다고 보긴 어렵습니다.',
    source: '커뮤니티 관찰',
  },
  {
    speciesA: 'red-belly-piranha-sp',
    speciesB: 'silver-dollar',
    result: 'caution',
    reason:
      '피라냐와 실버달러는 남미에서 실제로 서식지를 공유하는 조합으로, 실버달러의 빠른 유영 속도 덕분에 충분히 큰 수조에서는 종종 함께 사육됩니다. 그래도 위험이 완전히 없는 건 아니라 대형 수조와 충분한 무리가 전제됩니다.',
    source: '도감/커뮤니티',
  },
];

interface RawSpeciesData {
  groups: Record<
    string,
    {
      temp: [number, number];
      ph: [number, number];
      tankMin: number;
      temperament: CareGroup['temperament'];
      diet: string;
      feeding: string;
      lifespan: string;
      waterLevel: string;
      schooling: { need: boolean; minGroup: number };
      difficulty: string;
      color: string;
      tips: string;
      finNipper: boolean;
      predatory: boolean;
      sameSpeciesAggressionOnly: boolean;
      breedingAggressionOnly: boolean;
      territorial: boolean;
      waterSensitivity: CareGroup['waterSensitivity'];
    }
  >;
  species: {
    id: string;
    name: string;
    nameEn: string | null;
    latin: string;
    origin: string | null;
    maxSize: number;
    aliases: string[];
    groupId: string;
    note: string | null;
    genus: string | null;
  }[];
}

let cache: Promise<ReferenceData> | null = null;

// Loads species/care-group reference data. Reads from Supabase when a
// project is configured (see web/.env.example); otherwise falls back to the
// bundled static JSON (web/public/species_data.json, a copy of
// data/species_data.json) so the app works before Supabase is wired up.
export function getReferenceData(): Promise<ReferenceData> {
  if (!cache) {
    cache = isSupabaseConfigured ? fetchFromSupabase() : fetchFromLocalJson();
  }
  return cache;
}

async function fetchFromLocalJson(): Promise<ReferenceData> {
  const res = await fetch('/species_data.json');
  if (!res.ok) throw new Error(`Failed to load local species data: ${res.status}`);
  const raw: RawSpeciesData = await res.json();

  const careGroups: Record<string, CareGroup> = {};
  for (const [id, g] of Object.entries(raw.groups)) {
    careGroups[id] = { id, ...g };
  }

  const species: Species[] = raw.species.map((s) => ({
    id: s.id,
    groupId: s.groupId,
    name: s.name,
    nameEn: s.nameEn,
    latin: s.latin,
    genus: s.genus,
    origin: s.origin,
    maxSize: s.maxSize,
    aliases: s.aliases ?? [],
    note: s.note,
  }));

  return { careGroups, species, overrides: LOCAL_PAIR_OVERRIDES };
}

async function fetchFromSupabase(): Promise<ReferenceData> {
  if (!supabase) throw new Error('Supabase client not initialized');

  const [groupsRes, speciesRes, overridesRes] = await Promise.all([
    supabase.from('care_groups').select('*'),
    supabase.from('species').select('*'),
    supabase.from('species_pair_overrides').select('*'),
  ]);

  if (groupsRes.error) throw groupsRes.error;
  if (speciesRes.error) throw speciesRes.error;
  if (overridesRes.error) throw overridesRes.error;

  const careGroups: Record<string, CareGroup> = {};
  for (const g of groupsRes.data) {
    careGroups[g.id] = {
      id: g.id,
      temp: [g.temp_min, g.temp_max],
      ph: [g.ph_min, g.ph_max],
      tankMin: g.tank_min,
      temperament: g.temperament,
      diet: g.diet,
      feeding: g.feeding,
      lifespan: g.lifespan,
      waterLevel: g.water_level,
      schooling: { need: g.schooling_need, minGroup: g.schooling_min_group },
      difficulty: g.difficulty,
      color: g.color,
      tips: g.tips,
      finNipper: g.fin_nipper,
      predatory: g.predatory,
      sameSpeciesAggressionOnly: g.same_species_aggression_only,
      breedingAggressionOnly: g.breeding_aggression_only,
      territorial: g.territorial,
      waterSensitivity: g.water_sensitivity,
    };
  }

  const species: Species[] = speciesRes.data.map((s) => ({
    id: s.id,
    groupId: s.group_id,
    name: s.name,
    nameEn: s.name_en,
    latin: s.latin,
    genus: s.genus,
    origin: s.origin,
    maxSize: s.max_size,
    aliases: s.aliases ?? [],
    note: s.note,
  }));

  const overrides: SpeciesPairOverride[] = overridesRes.data.map((o) => ({
    speciesA: o.species_a,
    speciesB: o.species_b,
    result: o.result,
    reason: o.reason,
    source: o.source,
  }));

  return { careGroups, species, overrides };
}

export type Temperament = 'peaceful' | 'semi-aggressive' | 'aggressive';
export type WaterSensitivity = 'low' | 'medium' | 'high';
export type Verdict = 'ok' | 'caution' | 'bad';

// Care spec shared by a group of species/color-variants. Mirrors the
// `care_groups` table (supabase/migrations/0001_schema.sql), which mirrors
// the `careGroups` object in the original app/index.html prototype.
export interface CareGroup {
  id: string;
  temp: [number, number];
  ph: [number, number];
  tankMin: number;
  temperament: Temperament;
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
  waterSensitivity: WaterSensitivity;
}

// A single species/variant. References a CareGroup via groupId.
// Mirrors the `species` table.
export interface Species {
  id: string;
  groupId: string;
  name: string;
  nameEn: string | null;
  latin: string;
  genus: string | null;
  origin: string | null;
  maxSize: number;
  aliases: string[];
  note: string | null;
}

// Known real-world exception to the rule engine's conclusion.
// Mirrors the `species_pair_overrides` table.
export interface SpeciesPairOverride {
  speciesA: string;
  speciesB: string;
  result: Verdict;
  reason: string;
  source: string | null;
}

export interface CompatReason {
  sev: 0 | 1 | 2;
  text: string;
}

export interface CompatResult {
  severity: 0 | 1 | 2;
  reasons: CompatReason[];
  tempOverlap: [number, number] | null;
  phOverlap: [number, number] | null;
  tankMin: number;
}

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

export interface TankCheckPair {
  a: Species;
  b: Species;
  result: CompatResult;
}

export interface TankCheckResult {
  pairs: TankCheckPair[];
  worst: 0 | 1 | 2;
  combinedTemp: [number, number] | null;
  combinedPh: [number, number] | null;
  recommendedTank: number;
}

// A personal tank ("내 어항"). Mirrors the `tanks` table.
export interface Tank {
  id: string;
  userId: string;
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeL: number;
  createdAt: string;
}

// A species stocked in a tank, with a headcount. Mirrors `tank_species`.
export interface TankSpeciesEntry {
  id: string;
  tankId: string;
  speciesId: string;
  count: number;
}

// A water-quality log entry. Mirrors `water_logs`.
export interface WaterLogEntry {
  id: string;
  tankId: string;
  loggedAt: string;
  temp: number | null;
  ph: number | null;
  ammonia: number | null;
  nitrite: number | null;
  nitrate: number | null;
  note: string | null;
}

// A recurring maintenance reminder (feeding, water change, ...). Mirrors `reminders`.
export interface Reminder {
  id: string;
  tankId: string;
  label: string;
  intervalDays: number;
  lastDone: string;
}

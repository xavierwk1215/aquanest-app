import { supabase } from './supabase';
import type { Reminder, Tank, TankSpeciesEntry, WaterLogEntry } from './types';

function requireClient() {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.');
  return supabase;
}

function mapTank(row: {
  id: string;
  user_id: string;
  name: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  volume_l: number;
  created_at: string;
}): Tank {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    lengthCm: row.length_cm,
    widthCm: row.width_cm,
    heightCm: row.height_cm,
    volumeL: row.volume_l,
    createdAt: row.created_at,
  };
}

function mapTankSpecies(row: { id: string; tank_id: string; species_id: string; count: number }): TankSpeciesEntry {
  return { id: row.id, tankId: row.tank_id, speciesId: row.species_id, count: row.count };
}

function mapWaterLog(row: {
  id: string;
  tank_id: string;
  logged_at: string;
  temp: number | null;
  ph: number | null;
  ammonia: number | null;
  nitrite: number | null;
  nitrate: number | null;
  note: string | null;
}): WaterLogEntry {
  return {
    id: row.id,
    tankId: row.tank_id,
    loggedAt: row.logged_at,
    temp: row.temp,
    ph: row.ph,
    ammonia: row.ammonia,
    nitrite: row.nitrite,
    nitrate: row.nitrate,
    note: row.note,
  };
}

function mapReminder(row: { id: string; tank_id: string; label: string; interval_days: number; last_done: string }): Reminder {
  return { id: row.id, tankId: row.tank_id, label: row.label, intervalDays: row.interval_days, lastDone: row.last_done };
}

export async function listTanks(): Promise<Tank[]> {
  const { data, error } = await requireClient().from('tanks').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapTank);
}

export async function createTank(input: {
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumeL: number;
  userId: string;
}): Promise<Tank> {
  const { data, error } = await requireClient()
    .from('tanks')
    .insert({
      user_id: input.userId,
      name: input.name,
      length_cm: input.lengthCm,
      width_cm: input.widthCm,
      height_cm: input.heightCm,
      volume_l: input.volumeL,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapTank(data);
}

export async function updateTank(
  id: string,
  patch: { name: string; lengthCm: number; widthCm: number; heightCm: number; volumeL: number }
): Promise<void> {
  const { error } = await requireClient()
    .from('tanks')
    .update({
      name: patch.name,
      length_cm: patch.lengthCm,
      width_cm: patch.widthCm,
      height_cm: patch.heightCm,
      volume_l: patch.volumeL,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteTank(id: string): Promise<void> {
  const { error } = await requireClient().from('tanks').delete().eq('id', id);
  if (error) throw error;
}

export async function listTankSpecies(tankId: string): Promise<TankSpeciesEntry[]> {
  const { data, error } = await requireClient().from('tank_species').select('*').eq('tank_id', tankId);
  if (error) throw error;
  return data.map(mapTankSpecies);
}

// Replaces the full stocking list for a tank (matches the original app's
// behavior of saving the whole species chip list on each edit).
export async function setTankSpecies(tankId: string, entries: { speciesId: string; count: number }[]): Promise<void> {
  const client = requireClient();
  const { error: deleteError } = await client.from('tank_species').delete().eq('tank_id', tankId);
  if (deleteError) throw deleteError;
  if (entries.length === 0) return;
  const { error: insertError } = await client
    .from('tank_species')
    .insert(entries.map((e) => ({ tank_id: tankId, species_id: e.speciesId, count: e.count })));
  if (insertError) throw insertError;
}

export async function listWaterLogs(tankId: string): Promise<WaterLogEntry[]> {
  const { data, error } = await requireClient().from('water_logs').select('*').eq('tank_id', tankId).order('logged_at', { ascending: true });
  if (error) throw error;
  return data.map(mapWaterLog);
}

export async function addWaterLog(
  tankId: string,
  entry: { loggedAt: string; temp: number | null; ph: number | null; ammonia: number | null; nitrite: number | null; nitrate: number | null; note: string | null }
): Promise<WaterLogEntry> {
  const { data, error } = await requireClient()
    .from('water_logs')
    .insert({
      tank_id: tankId,
      logged_at: entry.loggedAt,
      temp: entry.temp,
      ph: entry.ph,
      ammonia: entry.ammonia,
      nitrite: entry.nitrite,
      nitrate: entry.nitrate,
      note: entry.note,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapWaterLog(data);
}

export async function deleteWaterLog(id: string): Promise<void> {
  const { error } = await requireClient().from('water_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function listReminders(tankId: string): Promise<Reminder[]> {
  const { data, error } = await requireClient().from('reminders').select('*').eq('tank_id', tankId).order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(mapReminder);
}

export async function addReminder(tankId: string, label: string, intervalDays: number): Promise<Reminder> {
  const { data, error } = await requireClient()
    .from('reminders')
    .insert({ tank_id: tankId, label, interval_days: intervalDays, last_done: new Date().toISOString().slice(0, 10) })
    .select('*')
    .single();
  if (error) throw error;
  return mapReminder(data);
}

export async function markReminderDone(id: string): Promise<void> {
  const { error } = await requireClient()
    .from('reminders')
    .update({ last_done: new Date().toISOString().slice(0, 10) })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await requireClient().from('reminders').delete().eq('id', id);
  if (error) throw error;
}

export function reminderStatus(r: Reminder): 'overdue' | 'due-today' | 'ok' {
  const next = addDaysStr(r.lastDone, r.intervalDays);
  const today = new Date().toISOString().slice(0, 10);
  if (next < today) return 'overdue';
  if (next === today) return 'due-today';
  return 'ok';
}

export function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

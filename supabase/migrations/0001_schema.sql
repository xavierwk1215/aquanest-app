-- Reference data: species care specs, shared by color/breed variants of the same species.
-- Mirrors app/index.html's careGroups object.
create table if not exists care_groups (
  id text primary key,
  temp_min numeric not null,
  temp_max numeric not null,
  ph_min numeric not null,
  ph_max numeric not null,
  tank_min integer not null,
  temperament text not null check (temperament in ('peaceful','semi-aggressive','aggressive')),
  diet text not null,
  feeding text not null,
  lifespan text not null,
  water_level text not null,
  schooling_need boolean not null default false,
  schooling_min_group integer not null default 1,
  difficulty text not null,
  color text not null,
  tips text not null,
  fin_nipper boolean not null default false,
  predatory boolean not null default false,
  same_species_aggression_only boolean not null default false,
  breeding_aggression_only boolean not null default false,
  territorial boolean not null default false,
  water_sensitivity text not null check (water_sensitivity in ('low','medium','high')),
  check (temp_min <= temp_max),
  check (ph_min <= ph_max)
);

-- Individual species/variants. Many species can share one care_groups row.
create table if not exists species (
  id text primary key,
  group_id text not null references care_groups(id),
  name text not null,
  name_en text,
  latin text not null,
  genus text,
  origin text,
  max_size numeric not null,
  aliases text[] not null default '{}',
  note text
);

create index if not exists species_group_id_idx on species(group_id);

-- Known real-world exceptions that the rule engine can't derive on its own.
-- Mirrors SPECIES_PAIR_OVERRIDES in app/index.html.
create table if not exists species_pair_overrides (
  id bigint generated always as identity primary key,
  species_a text not null references species(id),
  species_b text not null references species(id),
  result text not null check (result in ('ok','caution','bad')),
  reason text not null,
  source text,
  check (species_a <> species_b)
);

create unique index if not exists species_pair_overrides_unordered_idx
  on species_pair_overrides (least(species_a, species_b), greatest(species_a, species_b));

-- User-owned data: personal tanks ("내 어항")
create table if not exists tanks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  length_cm numeric,
  width_cm numeric,
  height_cm numeric,
  volume_l numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists tanks_user_id_idx on tanks(user_id);

create table if not exists tank_species (
  id uuid primary key default gen_random_uuid(),
  tank_id uuid not null references tanks(id) on delete cascade,
  species_id text not null references species(id),
  count integer not null default 1 check (count > 0),
  added_at timestamptz not null default now()
);

create index if not exists tank_species_tank_id_idx on tank_species(tank_id);

create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  tank_id uuid not null references tanks(id) on delete cascade,
  logged_at date not null default current_date,
  temp numeric,
  ph numeric,
  ammonia numeric,
  nitrite numeric,
  nitrate numeric,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists water_logs_tank_id_idx on water_logs(tank_id);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  tank_id uuid not null references tanks(id) on delete cascade,
  label text not null,
  interval_days integer not null check (interval_days > 0),
  last_done date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists reminders_tank_id_idx on reminders(tank_id);

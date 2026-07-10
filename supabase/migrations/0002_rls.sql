-- Reference data: readable by anyone (incl. anonymous visitors browsing the dex),
-- writable only via the Supabase dashboard / service role (no client-side write policy).
alter table care_groups enable row level security;
alter table species enable row level security;
alter table species_pair_overrides enable row level security;

create policy "care_groups are publicly readable"
  on care_groups for select
  using (true);

create policy "species are publicly readable"
  on species for select
  using (true);

create policy "species_pair_overrides are publicly readable"
  on species_pair_overrides for select
  using (true);

-- User-owned data: each user can only see/modify their own tanks and the
-- records that hang off them.
alter table tanks enable row level security;
alter table tank_species enable row level security;
alter table water_logs enable row level security;
alter table reminders enable row level security;

create policy "users manage their own tanks"
  on tanks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage species in their own tanks"
  on tank_species for all
  using (exists (
    select 1 from tanks t where t.id = tank_species.tank_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from tanks t where t.id = tank_species.tank_id and t.user_id = auth.uid()
  ));

create policy "users manage water logs in their own tanks"
  on water_logs for all
  using (exists (
    select 1 from tanks t where t.id = water_logs.tank_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from tanks t where t.id = water_logs.tank_id and t.user_id = auth.uid()
  ));

create policy "users manage reminders in their own tanks"
  on reminders for all
  using (exists (
    select 1 from tanks t where t.id = reminders.tank_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from tanks t where t.id = reminders.tank_id and t.user_id = auth.uid()
  ));

# Tropical Fish Species Guide & Compatibility Checker

English | [한국어](README.md)

Personal project — a species guide for tropical freshwater fish keepers, a rule-based tankmate compatibility engine, and a personal tank management tool.

**Live prototype**: (link to be added after deployment)

---

## What this project is meant to demonstrate

This repository documents the process of going from **data modeling → data validation → rule-based decision engine design**, before migrating to a production architecture (React/Supabase). The workflow mirrors what a BI/data analyst does in practice.

| Process | What was done in this project |
|---|---|
| Data modeling | Normalized relational structure (`species` ↔ `careGroups`, 1:N) |
| ETL / data pipeline | Bidirectional Excel ↔ JSON conversion scripts, round-trip verified |
| Multi-source data validation | Cross-checked figures across 2+ independent sources (FishLore, AquaticCommunity), reconciled discrepancies |
| Data quality control | Automated validation (range inversion, invalid enums, referential integrity), detection and correction of taxonomic misclassification |
| Rule-based decision engine | Category-matrix lookup + stepwise downgrade rules + an explicit exception table |

See [`docs/DATA_METHODOLOGY.md`](docs/DATA_METHODOLOGY.md) for the full writeup.

---

## Repository layout

```
app/        Legacy prototype (HTML/CSS/JS, PWA) — kept for reference; new work happens in web/
web/        React + TypeScript + Vite migration target (in progress)
supabase/   Supabase schema migrations (SQL) + seed data
data/       Species data (JSON) + a human-reviewable Excel export
scripts/    Data pipeline (Excel<->JSON conversion, source cross-verification, Excel report generation, Supabase seed SQL generation)
docs/       Data modeling & validation methodology
```

## Data model

```
careGroups (spec table, keyed by group ID)
├── temp, ph, tankMin        water/care requirements
├── temperament               peaceful / semi-aggressive / aggressive
├── finNipper, predatory, …   behavioral flags (boolean)
└── ...

species (individual entity table, FK to a group)
├── id, name, latin, genus, origin, maxSize
├── aliases[]                 trade names (color/strain variants of the same species)
├── groupId → careGroups.id
└── note                      species-specific exceptions
```
Species that come in many color variants (guppies, many cichlids, etc.) share a single care-spec record instead of duplicating it per variant. Mapped to SQL, `careGroups` is the parent table and `species` is the child table referencing it via `groupId` as a foreign key — a standard 1:N relationship.

## Compatibility engine

Numeric data (temperature, pH) is evaluated with straightforward range-overlap checks. Qualitative data (temperament) is evaluated with a **3×3 category-matrix lookup** rather than an invented numeric score — the design principle is to never assign an arbitrary score (e.g. "aggression: 7/10") to something that isn't actually measured.

Secondary risk factors (niche competition, water sensitivity, etc.) apply as **single-step downgrades rather than additive scoring**, so the final verdict can always be traced back to a specific reason. Cases the rules can't capture are tracked separately in a `species_pair_override` exception table with a cited source.

## Tech stack (current prototype)

- Frontend: Vanilla HTML/CSS/JS (no framework), PWA
- Data pipeline: Python (openpyxl)
- Storage: static JSON (bundled with the app) + personal data in browser localStorage

## Migration progress (React + Supabase)

A Vite + React + TypeScript project has been started under `web/`.

- The data model and compatibility engine (`web/src/lib/compat.ts`) were ported to TypeScript with the same rules/logic as the original.
- `supabase/migrations/` defines `care_groups` / `species` / `species_pair_overrides` (public reference data, read-only RLS) plus `tanks` / `tank_species` / `water_logs` / `reminders` (user-owned data, RLS-scoped to the owner).
- `scripts/generate_supabase_seed.mjs` generates a Supabase seed SQL file from `data/species_data.json`.
- Without a Supabase project configured, the app falls back to a bundled copy of the JSON (`web/public/species_data.json`) so the species guide and compatibility checker work out of the box. Filling in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `web/.env` switches it over to Supabase automatically.
- Auth: Supabase Auth email magic links (personal tank data is isolated per account via RLS).
- Remaining: port the multi-species tank builder check, port My Tanks CRUD (water logs/reminders), connect a real Supabase project and apply the seed.

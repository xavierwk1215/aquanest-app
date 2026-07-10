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
app/        Runnable frontend prototype (HTML/CSS/JS, PWA)
data/       Species data (JSON) + a human-reviewable Excel export
scripts/    Data pipeline (Excel<->JSON conversion, source cross-verification, Excel report generation)
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

## Next steps

Planning a migration to React + Supabase (PostgreSQL). Roadmap tracked in project issues.

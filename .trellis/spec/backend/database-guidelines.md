# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

- **ORM**: FreeSql 3.2.x with `FreeSql.Provider.PostgreSQL`
- **Database**: PostgreSQL (`fusim`); schemas `auth` and `cbaldur`
- **Connection key**: `ConnectionStrings:PostgreSQL` (Npgsql format: `Host` / `Username` / `Database`)
- **Migrations**: no migration scripts; `UseAutoSyncStructure(true)` creates/alters tables on first CRUD
- **Schema bootstrap**: FreeSql does not create schemas — run `CREATE SCHEMA IF NOT EXISTS auth` / `cbaldur` at startup (and in compose init SQL)

## Entity mapping

Qualify every table as `schema.table` via `[Table(Name = "...")]`:

| Model | Table |
|-------|-------|
| `UserModel` | `auth.users` |
| `OrganizationModel` | `auth.organizations` |
| `CaseModel` | `cbaldur.cases` |
| `NoticeModel` | `cbaldur.notices` |

Do not rely on `search_path` for AutoSync. Prefer `jsonb` for JSON columns and `text` for long strings (not MySQL `mediumtext` / `json`).

## Query Patterns

Single `IFreeSql` singleton; cross-schema joins via `Navigate` / `Select<A,B>().LeftJoin(...)` are fine when both entities use qualified names.

## Common Mistakes

- Unqualified `[Table(Name = "users")]` — AutoSync may target `public` while CRUD uses `search_path`
- Expecting FreeSql to create schemas — it only creates tables inside existing schemas
- MySQL-style connection keys (`server`, `user`) — use Npgsql `Host` / `Username`
- Comparing `jsonb` columns to `""` in FreeSql projections — PostgreSQL casts `''` to json and throws `22P02`; use `!= null` only (empty string is not valid jsonb)

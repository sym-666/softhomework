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
| `UserModel` | `auth.users` (`Avatar` bytea + `AvatarContentType`; JSON exposes `avatar` URL via ignored projection) |
| `OrganizationModel` | `auth.organizations` |
| `CaseModel` | `cbaldur.cases` (`Id` uuid PK; `CaseId` int per-user sequence; unique `(UserId, CaseId)`) |
| `NoticeModel` | `cbaldur.notices` |

Do not rely on `search_path` for AutoSync. Prefer `jsonb` for JSON columns and `text` for long strings (not MySQL `mediumtext` / `json`). Use `bytea` for binary blobs (avatars, password hashes/salts).

### Binary columns and JSON

- Map blobs as `byte[]` with `[Column(DbType = "bytea")]` (or FreeSql default for `byte[]`).
- Always `[JsonIgnore]` on `byte[]` entity fields (`Avatar`, `PasswordHash`, `PasswordSalt`) so list/detail JSON never ships Base64.
- Avatar API: persist bytes + MIME; serve via `GET /api/User/Avatar`; project `avatar` as a same-origin URL (`/api/User/Avatar?v=…`), never a data URI in DB or JSON.
- FreeSql AutoSync may not coerce `text` → `bytea`; drop the old column at startup (dev wipe OK) before sync recreates it.

## Query Patterns

Single `IFreeSql` singleton; cross-schema joins via `Navigate` / `Select<A,B>().LeftJoin(...)` are fine when both entities use qualified names.

## Common Mistakes

- Unqualified `[Table(Name = "users")]` — AutoSync may target `public` while CRUD uses `search_path`
- Expecting FreeSql to create schemas — it only creates tables inside existing schemas
- MySQL-style connection keys (`server`, `user`) — use Npgsql `Host` / `Username`
- Comparing `jsonb` columns to `""` in FreeSql projections — PostgreSQL casts `''` to json and throws `22P02`; use `!= null` only (empty string is not valid jsonb)
- Returning entity graphs with `byte[]` without `[JsonIgnore]` — System.Text.Json emits huge Base64 (passwords/avatars leak into API)
- `SELECT MAX(...) FOR UPDATE` — PostgreSQL rejects FOR UPDATE with aggregates (`0A000`); lock `ORDER BY … DESC LIMIT 1 FOR UPDATE` (or lock concrete rows) then compute next id in app code

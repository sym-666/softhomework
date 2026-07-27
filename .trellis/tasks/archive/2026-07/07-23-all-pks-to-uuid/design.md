# Design: all remaining PKs → UUID

## Scope

| Entity | PK now | Target | Notes |
|--------|--------|--------|-------|
| `UserModel` | int identity | `Guid` | JWT subject |
| `OrganizationModel` | int identity | `Guid` | |
| `NoticeModel` | int identity | `Guid` | |
| `CaseModel.Id` | Guid | unchanged | |
| `CaseModel.UserId` | int? | `Guid?` | FK |
| `UserModel.OrganizationId` | int? | `Guid?` | FK |
| `NoticeModel.OrganizationId` | int? | `Guid?` | FK |
| `UserModel.RoleId` | int | **unchanged** | |
| `CaseModel.CaseId` | int | **unchanged** | per-user sequence |

## Bootstrap wipe

Extend `Program.cs` FreeSql init (same pattern as cases/avatar):

- If `auth.users.id` is int4/int8 → `DROP TABLE` users (and dependents: cases first if FK, or `CASCADE`)
- Same for `auth.organizations`, `cbaldur.notices`
- If `cbaldur.cases.userid` is int → drop cases (or always drop cases when users wiped)

Order: drop `cbaldur.cases`, `cbaldur.notices`, then `auth.users`, `auth.organizations` (or `DROP … CASCADE`). Dev-only discard OK.

Optional: clear `{UserDir}/*` int-named dirs — document manual or best-effort delete of non-Guid folder names.

## Auth / claims

- `GenerateJwtToken`: `ClaimTypes.NameIdentifier` = `user.Id.ToString()` (Guid format)
- `OrganizationId` claim = Guid string or omit
- `ClaimsPrincipalExtensions`:
  - `GetUserId()` → `Guid` (`Guid.TryParse`, invalid → `Guid.Empty` or throw)
  - `GetOrganizationId()` → `Guid?`
  - `GetRoleId()` stays `int`

All controllers/services using `int userId` from claims → `Guid`.

## Filesystem / pipeline

- `{UserDir}/{userId}/{caseId}` where both segments are Guid strings
- Share cache: `{userIdGuid}:{caseGuid}`
- SSE broker keyed by `Guid userId`

## Frontend

- Types: `User.id`, `organizationId`, `Notice.id`, case `userId` → `string`
- Routes `/cases/:userId/:caseId` already path strings; parse as UUID
- Admin org/user/notice mutations: Guid string params
- Re-login required after deploy (old JWT int subject invalid)

## OpenAPI / specs

- Update `database-guidelines.md` entity table
- Patch OpenAPI int32 ids → uuid for user/org/notice/case.userId
- Case list contract: `userId` type → string uuid

## Rollback

- Revert models + claims; wipe uuid tables; restore int identity (data already discarded)

## Trade-offs

- All sessions invalidated once
- No keep-old-accounts path (accepted)

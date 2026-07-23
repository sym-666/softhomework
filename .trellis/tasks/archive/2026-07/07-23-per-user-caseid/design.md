# Design: per-user caseId + UUID PK

## Architecture

```
CreateCase
  → alloc CaseId = max(user)+1 (txn)
  → Id = Guid.NewGuid()
  → Insert
  → workdir = {UserDir}/{userId}/{Id}
  → pipeline placeholders: {userId}, {caseId}:=Id.ToString()

HTTP / Frontend
  → navigate & query by Id (Guid)
  → list/detail also return CaseId (int) for display/sort
```

## Data model

`cbaldur.cases`:

| Column | Type | Notes |
|--------|------|-------|
| `Id` | `uuid` PK | was int identity |
| `CaseId` | `int` not null | per-user sequence |
| `UserId` | `int` | owner |
| … | existing | Status, Comment, jsonb, etc. |

Constraints: unique `(UserId, CaseId)`. Drop identity on old `Id`.

FreeSql: `[Column(IsPrimary = true)] public Guid Id` — **not** `IsIdentity`.  
`CaseId` plain int. Allocate in service with `SELECT MAX(CaseId) … FOR UPDATE` / transaction equivalent under FreeSql.

**Discard path**: truncate or drop `cbaldur.cases` (and old int dirs) before/after model change if AutoSync cannot alter PK type cleanly; document in implement rollback.

## API / contract changes

- `CaseListItemModel.Id`: `Guid`；新增 `CaseId: int`
- `GetCase?id=`：`Guid id`（保持参数名 `id`）
- `GetCaseForAdmin`：`userId` + `id`（Guid），去掉整型 caseId 参数或改名
- Plot/Case file endpoints：凡 `caseId` int → `Guid`（参数可仍叫 `caseId` 但类型为 Guid，或统一改 `id`；**推荐参数名 `id`/`caseId` 均为 Guid 时在 OpenAPI 标明，展示序号只用响应体 `caseId` int**）
- SSE payload：`{ id: uuid, caseId: int, status }` 或至少 `id: uuid`（前端现主要 invalidate tags；对齐契约）
- Share cache value：`{userId}:{uuid}`
- Create 响应：返回新 `id`（Guid）与 `caseId`（int）

Frontend:

- Route：`/cases/:userId/:caseId` → 参数语义改为 UUID（路由段可改名 `:id`）
- RTK：`getCase(id: string)`；list `id: string`；`caseId: number` 展示
- 比较/绘图请求体中的 case 引用改为 UUID
- 更新 `.trellis/spec/backend/case-list-payload-contract.md` 与 SSE contract

## Filesystem / pipeline

- Local: `{UserDir}/{userId}/{guid}`
- `baldur-pipeline.yml` `{caseId}` → UUID 字符串（与现占位符名兼容，避免全量改 yaml 键名）
- `CaseStatusEvent`：主键改为 `Guid`；可选附带 display `CaseId`

## Compatibility / rollback

- No migrate-old-rows；wipe OK
- Rollback: revert model to int identity + restore code；data already wiped stays wiped

## Trade-offs

- UUID in URLs longer — accepted
- `{caseId}` placeholder name means UUID — document in pipeline schema comment

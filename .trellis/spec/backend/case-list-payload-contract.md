# Case List Payload Contract

## Scenario: Lightweight GetCases / GetCasesForAdmin Responses

### 1. Scope / Trigger

`GET /api/Case/GetCases` and `GET /api/Case/GetCasesForAdmin` must return a
lightweight list DTO. Shipping full `CaseModel` rows (including `caseJson`,
`caseNamelist`, nested `user`) inflates first-paint cost for the cases page
and dashboard. This is a cross-layer response contract: backend projection,
OpenAPI shape, and frontend RTK Query types must stay aligned.

### 2. Signatures

- `GET /api/Case/GetCases` → `IList<CaseListItemModel>`
- `GET /api/Case/GetCasesForAdmin` → `IList<CaseListItemModel>` (same DTO)
- `ICaseService.GetCaseListItemsByUserIdAsync(int userId)`
- `ICaseService.GetCaseListItemsByOrganizationIdAsync(int organizationId)`
- `ICaseService.GetAllCaseListItemsAsync()`
- Detail remains on `GET /api/Case/GetCase?id=` → `CaseModel` (unchanged)

### 3. Contracts

`CaseListItemModel` response fields (camelCase JSON):

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | `number \| null` | Row identity / detail navigation |
| `userId` | `number \| null` | Owner / admin filtering |
| `status` | `string` | List / dashboard status |
| `comment` | `string` | Display label |
| `tags` | `string \| null` | Optional tags |
| `jsonOrNamelist` | `boolean \| null` | Template-new branch (JSON vs namelist) |
| `hasCaseJsonPrototype` | `boolean` | Disable JSON template button without shipping prototype body |
| `createdAt` / `updatedAt` | `string \| null` | Timestamps / runtime display |

Must **not** appear on list responses: `caseJson`, `caseNamelist`, nested
`user`, or full `caseJsonPrototype`.

Frontend `CaseListItem` mirrors this DTO. JSON template flow uses
`hasCaseJsonPrototype` for disabled state, then `useLazyGetCaseQuery(id)` to
fetch `caseJsonPrototype` on click.

### 4. Validation & Error Matrix

| Condition | Boundary behavior |
| --- | --- |
| Authenticated user calls `GetCases` | Return that user's list items only |
| Admin `GetCasesForAdmin` with org/user filters | Same DTO; existing auth/filter rules unchanged |
| List consumer needs prototype JSON | Call `GetCase`, not the list endpoint |
| Client types still expect `CaseModel` on list | Type/runtime mismatch; update RTK types |

### 5. Good/Base/Bad Cases

- Good: cases table and dashboard render from list fields only; JSON "use as
  template" fetches detail once on click.
- Base: `GetCase` still returns full `CaseModel` for namelist/json editors.
- Bad: re-adding `caseJson` / nested `user` to list responses "for convenience".

### 6. Tests Required

- `dotnet build` after DTO / service / controller changes.
- Frontend lint/typecheck after `CaseListItem` or list query generic changes.
- Manually verify list pagination/display, dashboard stats, and both template
  paths (namelist + JSON with lazy `GetCase`).

### 7. Wrong vs Correct

#### Wrong

```csharp
// List endpoints return full CaseModel (joins user, ships caseJson)
return await _caseService.GetCasesByUserIdAsync(userId);
```

#### Correct

```csharp
// List endpoints project CaseListItemModel; detail stays on GetCase
return await _caseService.GetCaseListItemsByUserIdAsync(userId);
```

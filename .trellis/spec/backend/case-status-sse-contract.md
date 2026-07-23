# Case Status SSE Contract

## Scenario: Realtime Case Status Refresh via SSE

### 1. Scope / Trigger

When a background pipeline finishes, `CaseService` writes `Status` to
`success` or `failed` but list UIs (`/cases`, home dashboard) would stay
stale without a push channel. This cross-layer contract covers:

- Server → client status notifications over SSE
- Frontend invalidation of RTK `Case` tags (full `GetCases` refetch)
- Cookie JWT auth on the long-lived stream
- Single-process in-memory broker (no Redis / SignalR in MVP)

List payload shape remains `CaseListItemModel` — see
[case-list-payload-contract.md](./case-list-payload-contract.md).

### 2. Signatures

**HTTP**

- `GET /api/Case/StatusEvents` → `text/event-stream` (SSE), `[Authorize]`

**Backend**

- `ICaseStatusNotifier.NotifyStatusChanged(int userId, int caseId, string status)`
- `ICaseStatusEventSource.SubscribeAsync(int userId, CancellationToken ct)` →
  `IAsyncEnumerable<CaseStatusEvent>`
- `CaseStatusBroker` — singleton implementing both interfaces
- Emit sites: after FreeSql status updates in
  `CaseService.ExecuteCalculationTask` and
  `ExecuteCalculationTaskByNamelist` (both success and catch/`failed` paths)

**Frontend**

- `useCaseStatusEvents(enabled: boolean)` — one `EventSource` while auth valid
- Mount once in `AuthGuard` so `/cases` and home share a single connection
- On `case-status`: `dispatch(caseApi.util.invalidateTags(['Case']))`

### 3. Contracts

**SSE framing**

| Piece | Value |
| --- | --- |
| Content-Type | `text/event-stream` |
| Event name | `case-status` |
| Heartbeat | SSE comment `: heartbeat` about every 20s |
| Connect comment | `: connected` on open |

**`data:` JSON payload (camelCase)**

| Field | Type | Constraints |
| --- | --- | --- |
| `caseId` | `number` | Case primary key |
| `status` | `string` | `"success"` \| `"failed"` only for MVP |

Payload is a **hint**; UI must treat `GetCases` as source of truth after
invalidation. Do not patch RTK cache from SSE alone in MVP.

**Auth / tenancy**

- Cookie `AuthToken` (same as REST); `EventSource(..., { withCredentials: true })`
- Fan-out only to subscribers for that `userId`
- Unauthenticated → 401 (no stream)

**Dev proxy**

- `rsbuild` `/api` proxy must not buffer SSE (no short timeout / buffering on)

**Deploy note**

- Broker is in-process; multi-instance backends need a shared bus (out of scope
  for this contract until added).

### 4. Validation & Error Matrix

| Condition | Boundary behavior |
| --- | --- |
| Valid cookie, user owns running case that finishes | `case-status` event → client invalidates → list refetch shows new status |
| Missing / invalid cookie | 401; no stream |
| Client disconnect mid-stream | Cancel subscription; ignore `IOException` / cancel on write |
| Status write without `NotifyStatusChanged` | UI stays stale until remount/focus — treat as bug |
| Create case | Still uses RTK `invalidatesTags` on mutation; **not** an SSE event |
| Admin `/admin` list | Out of scope — no StatusEvents consumer there |

### 5. Good/Base/Bad Cases

- Good: stay on `/cases` or home; pipeline ends; status flips without reload.
- Base: no open EventSource → behavior equals pre-SSE (mount/create refresh only).
- Bad: mounting `useCaseStatusEvents` on both home and `/cases` separately
  (duplicate connections); or patching list cache from SSE without refetch.

### 6. Tests Required

- `dotnet build` after notifier / controller / CaseService emit changes.
- Frontend lint/tsc on `useCaseStatusEvents` and `AuthGuard`.
- Manual: AC stay-on-page status flip; 401 without cookie; reconnect after drop.
- Assert both JSON and namelist pipeline paths call notify after success and
  failed writes.

### 7. Wrong vs Correct

#### Wrong

```csharp
// Update DB but never notify — list UIs stay on "running"
_fsql.Update<CaseModel>()
    .Set(c => c.Status, "success")
    .Where(c => c.Id == caseId)
    .ExecuteAffrows();
```

```tsx
// Patch cache from SSE instead of invalidating list contract
api.util.updateQueryData('getCases', {}, (draft) => { /* mutate one row */ });
```

#### Correct

```csharp
_fsql.Update<CaseModel>()
    .Set(c => c.Status, "success")
    .Where(c => c.Id == caseId)
    .ExecuteAffrows();
_caseStatusNotifier.NotifyStatusChanged(userId, caseId, "success");
```

```tsx
dispatch(caseApi.util.invalidateTags(['Case']));
```

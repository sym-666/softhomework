# Design: Cases realtime status via SSE

## Architecture

```
Pipeline background task (CaseService)
  → DB update Status success|failed
  → ICaseStatusNotifier.Notify(userId, caseId, status)
       ↓
In-process CaseStatusBroker (singleton)
  → Channel per connected user (or broadcast filtered by userId)
       ↓
GET /api/Case/StatusEvents  (SSE, [Authorize])
       ↓
Frontend EventSource (cookie AuthToken)
  → dispatch(caseApi.util.invalidateTags(['Case']))
  → GetCases refetch → /cases + dashboard update
```

## Boundaries

| Layer | Responsibility |
|-------|----------------|
| `CaseService.ExecuteCalculationTask*` | After successful FreeSql status write, call notifier |
| `ICaseStatusNotifier` + broker | Fan-out status events to that user's SSE subscribers |
| `CaseController` (or dedicated thin endpoint) | Authorized SSE stream; heartbeat; client disconnect cleanup |
| Frontend hook (e.g. `useCaseStatusEvents`) | One EventSource while authenticated; invalidate on event; reconnect |
| Mount point | Auth-guard / authenticated layout so home + `/cases` share one connection |

## Contracts

### SSE endpoint

- `GET /api/Case/StatusEvents`
- Auth: `[Authorize]` + existing JWT-from-cookie
- `Content-Type: text/event-stream`
- Keep-alive / comment heartbeat (e.g. every 15–30s) to survive proxies
- Disable response buffering where needed (Kestrel / proxy)

### Event payload (JSON in `data:`)

```json
{ "caseId": 123, "status": "success" }
```

`status` is `"success"` | `"failed"`. Payload is a hint; UI always refetches list.

Optional SSE `event:` name: `case-status` (or default `message`).

### Notifier API (backend)

```csharp
void NotifyStatusChanged(int userId, int caseId, string status);
```

Called only after DB update succeeds in both success and catch paths of `ExecuteCalculationTask` / `ExecuteCalculationTaskByNamelist`.

## Frontend

- Custom hook opens `EventSource('/api/Case/StatusEvents')` when auth valid; closes on logout/unmount.
- On message: `dispatch(caseApi.util.invalidateTags(['Case']))`.
- Reconnect: browser EventSource auto-reconnects; if custom close-on-error, exponential backoff reconnect.
- Dev proxy (`rsbuild.config.ts`): ensure SSE not buffered (proxy option if needed).

## Compatibility

- No change to `GetCases` / `CaseListItemModel` contract.
- No OpenAPI change required for list DTOs; may document SSE endpoint separately if tooling allows (SSE often omitted from generated clients).
- Multi-instance deploy: MVP assumes single backend process; document rollback / follow-up for Redis if horizontal scale needed.

## Trade-offs

| Choice | Why |
|--------|-----|
| SSE over WS | One-way notify; no SignalR dependency; cookie auth fits |
| invalidateTags over patch | Simpler consistency with existing RTK tags |
| In-process broker | Zero infra; enough for current docker-compose single backend |

## Rollback

- Feature-flag optional; or revert notifier calls + remove SSE endpoint/hook.
- Without SSE, behavior returns to current mount/create-only refresh.

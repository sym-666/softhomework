# Implement: Cases realtime status via SSE

## Checklist

1. **Backend broker + notifier**
   - [x] Add `ICaseStatusNotifier` + singleton in-process broker (Channel / ConcurrentDictionary of userId → subscribers).
   - [x] Register in Lamar/`Program.cs`.

2. **Emit on status write**
   - [x] In `CaseService.ExecuteCalculationTask` and `ExecuteCalculationTaskByNamelist`, after each `Status` update (`success` / `failed`), call `NotifyStatusChanged(userId, caseId, status)`.

3. **SSE endpoint**
   - [x] `GET` StatusEvents on `CaseController` (or adjacent controller under `/api/Case`), `[Authorize]`, `text/event-stream`, heartbeats, cancel on client disconnect.
   - [x] Verify JWT cookie path works for long-lived GET (existing `OnMessageReceived`).

4. **Frontend hook**
   - [x] `useCaseStatusEvents` (or similar under `src/hooks/`): EventSource → `invalidateTags(['Case'])`; cleanup; reconnect.
   - [x] Mount once under authenticated shell (`auth-guard` or layout used by home + `/cases`).

5. **Dev proxy**
   - [x] Adjust `rsbuild.config.ts` `/api` proxy if SSE stalls (disable buffering / longer timeout).

6. **Manual validation**
   - Stay on `/cases`, create case, wait for pipeline end → status updates without refresh.
   - Same on home dashboard.
   - Logged-out / invalid cookie → 401 on StatusEvents.
   - Kill connection briefly → reconnect still works.

## Validation commands

```bash
# Backend compile
cd cbaldur-backend && dotnet build

# Frontend typecheck / lint (project scripts)
cd cbaldur-frontend-next && npm run lint
```

Manual: `dotnet run` + `npm run dev`, exercise AC1–AC5.

## Risky files / rollback points

| Area | Files (expected) | Risk |
|------|------------------|------|
| Status write | `Services/CaseService.cs` | Miss notify on one path → stale UI |
| DI | `Program.cs` | Singleton lifetime wrong → missed events |
| SSE | `Controllers/CaseController.cs` (+ new types) | Buffering / auth on stream |
| Client | new hook + `auth-guard` | Duplicate EventSource if mounted twice |
| Proxy | `rsbuild.config.ts` | Dev-only SSE hang |

Rollback: remove notifier calls + endpoint + hook mount; list behavior unchanged.

## Pre-start gates

- [x] `prd.md` converged
- [x] `design.md` written
- [x] `implement.md` written
- [x] `implement.jsonl` / `check.jsonl` curated
- [ ] User review / approve `task.py start`

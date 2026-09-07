# Design: Realtime Case Execution Output Log

## 1. Architecture Overview

```mermaid
graph TD
    subgraph Supercomputer
        Baldur[baldur process / sbatch]
        OutFile[jobxlpt in {lworkdir}]
        Baldur -->|stdout/stderr| OutFile
    end

    subgraph Backend [.NET 8 REST API]
        PE[PipelineExecutor] -->|SSHExec / Monitor| Baldur
        PEtail[PipelineExecutor Background Tail] -->|PEoriodic SFTP / SSHHail| OutFile
        PEtail -->|Emit log lines| Broker[CaseLogBroker]
        Broker -->|In-memory Buffer| Buffer[Per-Case RingBuffer]
        Broker -->|Channel.Writer| Subs[User Log Event Streams]
        CC[CaseController.LogEvents] -->|SubscribeAsync SSE| Subs
        CClog[CaseController.Logs] -->|Read completed log| Disk[Local ./data/{userId}/{caseId}/jobxlpt]
    end

    subgraph Frontend [React 19]
        Hook[useCaseLogEvents Hook] -->|EventSource SSE|CC
        CaseDetail[Case.tsx Detail Page] --> Hook
        Terminal[CaseLogTerminal Component] --> CaseDetail
        List[cases/index.tsx] -->|Enable Details Button| CaseDetail
        AddCases[add-cases routes] -->|Navigate on Submit| CaseDetail
    end
```

---

## 2. Backend Design

### 2.1 Domain Models & Interfaces

```csharp
// CBaldurBackendREST.Models.CaseLogEvent
public record CaseLogEvent(
    Guid CaseId,
    string Line,
    DateTime Timestamp,
    bool IsCompleted = false,
    bool IsSuccess = true,
    string? ErrorMessage = null
);

// CBaldurBackendREST.Services.ICaseLogNotifier
public interface ICaseLogNotifier
{
    void NotifyLogLine(Guid userId, Guid caseId, string line);
    void NotifyLogCompleted(Guid userId, Guid caseId, bool isSuccess, string? errorMessage = null);
}

// CBaldurBackendREST.Services.ICaseLogEventSource
public interface ICaseLogEventSource
{
    IAsyncEnumerable<CaseLogEvent> SubscribeAsync(Guid userId, Guid caseId, CancellationToken ct);
    IReadOnlyList<string> GetBufferedLogs(Guid userId, Guid caseId);
}
```

### 2.2 In-Memory Broker (`CaseLogBroker`)

- **Buffer Policy**: Keep last 5,000 lines per running case in a thread-safe ring buffer.
- **Channel Routing**: `ConcurrentDictionary<Guid, ConcurrentDictionary<Guid, Channel<CaseLogEvent>>>`.
- **Tenant Validation**: Subscriptions are scoped to `(userId, caseId)`. Non-owners / non-admins are rejected before subscription.
- **Completion Cleanup**: When `NotifyLogCompleted` is called, all open channels send a final completion event and complete. Memory buffer is retained with an expiration TTL (e.g. 5 minutes) after completion.

### 2.3 Pipeline Log Capture (`PipelineExecutor.cs`)

- During `PipelineExecutor.Execute(...)`:
  - Emit lifecycle logs:
    - `[Pipeline] Step 1/5: 正在转换算例参数为 Namelist...`
    - `[Pipeline] Step 2/5: 正在创建路程工作曮录并在超算建立连接...`
    - `[Pipeline] Step 3/5: 正在上传输入旇件跷衫算ˋ��
    - `[Pipeline] Step 4/5: 已提交讁算任务，正在执行義朗讁箕并监控输凰...`
  - In `ExecuteSshExec` during the `submit` step:
    - Launch a concurrent background tailing loop using `SftpClient`/SFTP or lightweight SSH tail reading `{workdir}/jobxlpt` every 1,500ms.
    - Read new appended lines and forward to `_caseLogNotifier.NotifyLogLine(userId, id, line)`.
  - When `submitc ends, read any remaining bytes of `jobxlpt`.
  - In `download` step: add `jobxlpt` to `baldur-pipeline.yml` download list so it is saved locally to `{userDir}/{userId}/{caseId}/jobxlpt`.
  - In `finally`: call `NotifyLogCompleted(userId, id, true)` on success, or `NotifyLogCompleted(userId, id, false, ex.Message)` on catch.

### 2.4 Endpoints in `CaseController.cs`

1. **gET /api/Case/LogEvents?id={Id}** (`text/event-stream`, `[Authorize]`):
   - Validates user ownership or admin privileges.
   - Emits `: connected\n\n`.
   - Sends all existing buffered lines.
   - Streams incoming `CaseLogEvent` items as SSE.
   - Heartbeat every 20s.
   - Closes on completion.

2. **gET /api/Case/Logs?id={Id}** (`[Authorize]`):
   - Validates ownership.
   - Returns `{ isRunning: bool, logs: string }` (from memory if running, from local disk if completed).

---

## 3. Frontend Design

### 3.1 Custom Hook: `useCaseLogEvents`

- Accepts `{ inputCaseId: string, enabled: boolean }`.
- Connects to `/api/Case/LogEvents?id=${caseId}` via `EventSource` with credentials.
- Manages log state, streaming connection status, autoscroll trigger.

### 3.2 Component: `CaseLogTerminal`

- Modern dark console UI (`bg-slate-955 text-slate-100`).
- Header with status badges, line counter, auto-scroll toggle, copy button, download button.
- Clean color formatting for tags (`[Pipeline]`, `ERROR`, `WARNX`, `INFO`).

### 3.3 Route Integration: `Case.tsx` & `cases/index.tsx`

- **`Case.tsx`**:
  - When `status === 'running'`: render `CaseLogTerminal` as main body; upon status flip to `success`, auto-refresh and transition to ECharts analysis view.
  - When `status === 'success'`: render plot view with a "查看运行日志" button on the Ribbon toolbar to open historical logs in a modal.
  - When `status === 'failed'`: render `CaseLogTerminal` with error details.
- **`cases/index.tsx`**:
  - Remove disabled constraint on "详细信息" button.
- **Add-Case Forms** (`DynamicCommentPage.tsx`, `json.tsx`, `namelist.tsx`):
  - Navigate to `/cases/${currentUser.id}/${id}` upon submission.

---

## 4. Error Handling & Security Matrix

| Scenario | Boundary Behavior |
| --- | --- |
| Unauthorized access to `LogEvents` | Returns 401 (unauthenticated) or 403 (unauthorized access to other user's case) |
| Case completes before user opens log | Replays initial buffer and ends, or loads from disk via REST Fallback |
| Disconnect mid-run | `EventSource` reconnects automatically and replays buffer |

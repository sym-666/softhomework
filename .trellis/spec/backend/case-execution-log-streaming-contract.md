# Case Execution Log Streaming & Multi-File Tail Contract

## 1. Scope / Trigger

During calculation pipeline execution (specifically `ssh_exec` compute steps like Slurm `sbatch -W`), multiple output files (e.g. `jobxlpt`, `cbaldur.out`) are generated concurrently on remote supercomputers. This contract defines:

- Multi-file remote tailing over SFTP with per-file byte offset tracking.
- SSE stream fan-out tagged with file origin (`file: "jobxlpt" | "cbaldur.out" | "pipeline"`).
- REST fallback retrieval returning both aggregated lines and `logsByFile` dictionaries.
- Frontend multi-tab terminal switching with tab-scoped search, copy, and file download.

## 2. Pipeline Configuration

`baldur-pipeline.yml`:
```yaml
- id: submit
  type: ssh_exec
  description: 提交 Slurm 作业并等待完成
  ssh_exec:
    command: "cd {workdir} && ln -sf ../../submit.sh . && sbatch -W submit.sh"
    timeout: 0
    tail_files:
      - "{workdir}/jobxlpt"
      - "{workdir}/cbaldur.out"
```

## 3. Data Contracts

### 3.1 Backend Event Contract
```csharp
public record CaseLogEvent(
    Guid CaseId,
    string Line,
    DateTime Timestamp,
    bool IsCompleted = false,
    bool IsSuccess = true,
    string? ErrorMessage = null,
    string? File = null
);
```

### 3.2 SSE Event Payload
`GET /api/Case/LogEvents?id={caseId}&userId={userId}`
```json
{
  "caseId": "UUID",
  "line": "...",
  "timestamp": "2026-09-01T09:40:00.000Z",
  "isCompleted": false,
  "isSuccess": true,
  "errorMessage": null,
  "file": "jobxlpt"
}
```

### 3.3 REST Logs Response
`GET /api/Case/Logs?id={caseId}&userId={userId}`
```json
{
  "success": true,
  "isRunning": false,
  "status": "success",
  "logs": "...",
  "files": ["all", "jobxlpt", "cbaldur.out", "pipeline"],
  "logsByFile": {
    "jobxlpt": "...",
    "cbaldur.out": "...",
    "pipeline": "..."
  }
}
```

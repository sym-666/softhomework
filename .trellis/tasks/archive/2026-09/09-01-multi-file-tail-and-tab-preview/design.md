# 技术方案设计 (Design)

## 1. 架构与边界设计 (Architecture & Boundaries)

本方案贯穿系统 5 层结构，保持低耦合与向下兼容：

```
[YAML & Schema]
  baldur-pipeline.yml (tail_files) / pipeline-schema.json
         │
         ▼
[Backend Executor]
  PipelineExecutor.cs (并发多文件 SFTP 轮询 + lastOffset 独立记录 + 本地持久化)
         │
         ▼
[Event Broker & Notifier]
  CaseLogBroker.cs / ICaseLogNotifier.cs (带 file 来源标记的 CaseLogEvent)
         │
         ├───▶ SSE 实时通道 (/api/Case/LogEvents -> event: case-log { file, line, ... })
         └───▶ REST 历史接口 (/api/Case/Logs -> { files, logs, logsByFile })
         │
         ▼
[Frontend State & Hook]
  useCaseLogEvents.ts / caseApi (维护 logs, logsByFile, availableFiles)
         │
         ▼
[Frontend UI Components]
  CaseLogTerminal.tsx / Case.tsx (多 Tab 切换、文件独立行号/高亮/下载/搜索)
```

## 2. 数据契约与接口设计 (Data Contracts & APIs)

### 2.1 Pipeline Schema & YAML

`cbaldur-backend/Schemas/pipeline-schema.json`:
```json
"tail_files": {
  "type": "array",
  "items": { "type": "string" },
  "description": "Optional list of remote file path templates to tail concurrently in real-time"
}
```

`PipelineModel.cs`:
```csharp
public class SshExecConfig
{
    [YamlMember(Alias = "command")]
    public string Command { get; set; } = string.Empty;

    [YamlMember(Alias = "timeout")]
    public int Timeout { get; set; } = 0;

    [YamlMember(Alias = "tail_files")]
    public List<string>? TailFiles { get; set; }
}
```

### 2.2 日志事件契约 (Log Event Contracts)

`ICaseLogNotifier.cs`:
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

public interface ICaseLogNotifier
{
    void NotifyLogLine(Guid userId, Guid caseId, string line, string? file = null);
    void NotifyLogCompleted(Guid userId, Guid caseId, bool isSuccess, string? errorMessage = null);
}
```

- 流水线系统事件：`file = "pipeline"`
- 超算执行文件事件：`file = "jobxlpt"`、`file = "cbaldur.out"` 等（取自文件名）

### 2.3 REST 历史日志接口响应格式

`GET /api/Case/Logs?id={caseId}&userId={userId}`
```json
{
  "success": true,
  "isRunning": false,
  "status": "success",
  "files": ["all", "jobxlpt", "cbaldur.out", "pipeline"],
  "logs": "...",
  "logsByFile": {
    "jobxlpt": "...",
    "cbaldur.out": "...",
    "pipeline": "..."
  }
}
```

### 2.4 前端状态与 Hook 契约

`useCaseLogEvents.ts`:
```ts
export interface CaseLogEventPayload {
  caseId: string;
  line: string;
  timestamp: string;
  isCompleted: boolean;
  isSuccess: boolean;
  errorMessage?: string | null;
  file?: string | null;
}

export interface UseCaseLogEventsResult {
  logs: string[];
  logsByFile: Record<string, string[]>;
  files: string[];
  status: LogConnectionStatus;
  isCompleted: boolean;
  isSuccess: boolean;
  errorMessage: string | null;
  clearLogs: () => void;
  reconnect: () => void;
}
```

## 3. 前端交互与 UI 设计 (UI/UX Design)

1. **Tab 布局设计**：
   - 顶部提供 Tab 切换条（如 `全部 (All)`、`jobxlpt`、`cbaldur.out`、`pipeline`）。
   - 每个 Tab 附带小徽标 Badge 显示该文件的当前总行数。
   - 如果某个文件暂无日志，点击进入后显示友好等待占位符。
2. **操作联动机制**：
   - **搜索/过滤**：仅过滤当前选中 Tab 的日志行，高亮匹配内容。
   - **复制**：复制当前 Tab 的日志内容。
   - **下载**：下载当前 Tab 的内容，并以对应文件名（如 `jobxlpt-{caseId}.txt`、`cbaldur.out-{caseId}.txt`、`all-logs-{caseId}.txt`）命名。
   - **自动滚动**：每个 Tab 独立维护滚动状态。

## 4. 兼容性与降级 (Compatibility & Fallback)

- 旧数据/历史算例仅存在 `jobxlpt` 本地文件时，自动挂载 `jobxlpt` 与 `all` Tab。
- 若 pipeline 未配置 `tail_files` 且仅配置 `tail_file`，自动转换为单文件列表，完全兼容旧配置。
- 若既未配置 `tail_files` 也未配置 `tail_file`，在 `submit` 步骤默认监控 `jobxlpt` 与 `cbaldur.out`。

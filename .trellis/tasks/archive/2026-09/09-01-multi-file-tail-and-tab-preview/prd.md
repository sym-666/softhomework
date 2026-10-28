# 支持多文件 tail-file 与前端多 Tab 切换

## Goal

将 BALDUR 算例计算过程中的日志实时追踪（tail-file）能力从单一文件扩展为支持多文件并发追踪，并在前端控制台（`CaseLogTerminal`）提供多 Tab 切换查看（例如 `全部`、`jobxlpt`、`cbaldur.out`、流水线日志 `pipeline` 等），提供各 Tab 独立的行号、关键词搜索过滤高亮、复制与针对当前 Tab 文件的按需下载。

## Background & Confirmed Facts

1. **配置层**：当前 `pipeline-schema.json` 与 `baldur-pipeline.yml` 中仅支持 `tail_file: "{workdir}/jobxlpt"` 单一字符串配置。
2. **执行层**：`PipelineExecutor.cs` 在 `ssh_exec` 阶段启动单文件 SFTP 轮询任务，并将新增行同步写入 `localDir/jobxlpt`，同时调用 `_caseLogNotifier.NotifyLogLine(userId, caseId, line)`。
3. **分发与 API 层**：`CaseLogBroker.cs`、SSE 端点 `/api/Case/LogEvents` 和 REST 端点 `/api/Case/Logs` 传输与缓存纯文本行，未区分日志来源文件。
4. **前端交互层**：`useCaseLogEvents.ts`、`CaseLogTerminal.tsx` 与 `Case.tsx` 仅支持单终端展示单一日志流。

## Requirements

- **R1 (Schema & Config)**: 
  - `pipeline-schema.json` 与 `baldur-pipeline.yml` 直接采用 `tail_files`（字符串数组），移除旧的 `tail_file`。
  - 更新 `baldur-pipeline.yml` 中的超算计算步骤配置，包含 `jobxlpt` 与 `cbaldur.out`：
    ```yaml
    tail_files:
      - "{workdir}/jobxlpt"
      - "{workdir}/cbaldur.out"
    ```
- **R2 (Backend Concurrent Tailing & Persistence)**: 
  - `PipelineExecutor.cs` 支持多文件并发/循环 SFTP 增量读取。
  - 独立维护每个目标文件的读取偏移量（`lastOffset`），并将新内容分别追加到本地对应文件（如 `localDir/jobxlpt`、`localDir/cbaldur.out`）。
- **R3 (Backend Event Broker & REST API)**: 
  - `CaseLogEvent` 增加 `File` 字段（如 `"jobxlpt"`、`"cbaldur.out"`、`"pipeline"`），`ICaseLogNotifier` / `CaseLogBroker` 支持记录和筛选文件来源。
  - SSE 端点推送携带 `file` 字段。
  - `/api/Case/Logs` 支持返回所有可用文件列表、按文件聚合字典（`logsByFile`）及总览日志。
- **R4 (Frontend State & Hook)**: 
  - `useCaseLogEvents.ts` 与 RTK Query API `api/case.ts` 支持解析多文件日志，提供 `logs`、`logsByFile` 与 `availableFiles` 响应式状态。
- **R5 (Frontend Multi-Tab Terminal UI)**: 
  - `CaseLogTerminal.tsx` 顶部展示多 Tab 选项卡（如 `全部`、`jobxlpt`、`cbaldur.out` 等），Tab 标签展示该文件的行数统计。
  - 支持在不同 Tab 间无缝切换，日志高亮、搜索过滤、复制与下载均针对当前激活 Tab 生效。
  - 兼容实时流（`streaming`）与离线历史查看弹窗（`showLogModal`）。

## Acceptance Criteria

- [x] **AC1**: `pipeline-schema.json` 和 `baldur-pipeline.yml` 正确定义 `tail_files` 且通过 Schema 验证。
- [x] **AC2**: 后端 `PipelineExecutor` 能同时追踪 `jobxlpt` 和 `cbaldur.out`，并在本地持久化对应文件。
- [x] **AC3**: SSE `/api/Case/LogEvents` 正常下发带 `file` 标签的事件，`/api/Case/Logs` 正确返回多文件结构。
- [x] **AC4**: 前端控制台界面正确展示多 Tab 选项卡，点击 Tab 能即时切换对应文件日志。
- [x] **AC5**: 前端搜索过滤、复制、下载对应当前 Tab 选中的文件，下载文件名匹配对应 Tab。
- [x] **AC6**: 后端 `dotnet test` 全部通过，前端 `npm run lint` 和 `npm run build` 均无错误。

## Out of Scope

- 用户在前端动态添加或修改服务端要 tail 的任意远程文件路径（路径仍由后端 pipeline 配置控制）。

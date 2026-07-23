# 将 CaseService 从 fsubmit 迁移到 PipelineExecutor

## Goal

将后端 `CaseService` 中的案例计算提交逻辑，从调用外部 `Others/fsubmit` CLI 工具，迁移到使用已实现的 C# `PipelineExecutor`（基于 SSH/SFTP 直接连接超算执行配置化 pipeline），使任务提交流程完全由 C# 代码控制，便于错误处理、状态监控和后续扩展。

## Background

- `cbaldur-backend/Services/CaseService.cs` 当前通过 `ExecuteFsubmitScripts` 调用 `Others/fsubmit` 完成：创建远程目录 → 提交任务 → 下载结果（第 311–346 行）。
- `cbaldur-backend/Services/PipelineExecutor.cs` 已实现基于 `Renci.SshNet` 的 pipeline 执行器，支持 `convert`、`ssh_exec`、`ssh_upload`、`ssh_download`、`monitor`、`shell`、`postprocess` 等步骤。
- `cbaldur-backend/Services/PipelineService.cs` 从 `Schemas/*-pipeline.yml` 加载 pipeline 配置。
- `cbaldur-backend/Schemas/baldur-pipeline.yml` 已定义 `Beijing` 和 `Hubei` 两个超算的完整 pipeline，覆盖 convert / mkdir / upload / submit / download / postprocess 流程。
- `cbaldur-backend/Program.cs` 已将 `PipelineExecutor` 注册到 DI 容器。
- `CaseService` 目前未被注入 `PipelineExecutor` 或 `IPipelineService`，仍使用 `fsubmit`。

## Requirements

1. `CaseService` 创建案例后，使用 `PipelineExecutor` 执行对应超算的 pipeline，替代 `ExecuteFsubmitScripts`。
2. 保留现有 `CreateCaseAsync`（JSON 提交）和 `CreateCaseByNamelistAsync`（namelist 提交）的入口行为不变。
3. 转换后的 `jobxdat`、评论文件、本地目录结构等前置准备逻辑保持不变。
4. 下载结果后的本地后处理（解压 tar、跳过 YF.csv 前两行）由 pipeline 的 `postprocess` 步骤承担，或保留等效本地处理。
5. 任务执行结果需要正确更新 `CaseModel.Status`（成功/失败）。
6. 执行异常需要被捕获并记录日志，避免后台任务崩溃导致状态不一致。
7. `CaseService` 注入 `ILogger<CaseService>` 用于记录提交与执行异常。
8. 新增单元测试，使用 `cbaldur-backend/data/1/35/input.json` 与 `comment` 作为 fixture，验证 `cbaldur-json-to-nml` 转换后的 `jobxdat` 与 `cbaldur-backend/data/1/35/jobxdat` 完全一致，确保迁移前后转换行为不变。

## Acceptance Criteria

- [ ] `CaseService` 注入 `PipelineExecutor` 和 `IPipelineService`。
- [ ] `ExecuteCalculationTask` 和 `ExecuteCalculationTaskByNamelist` 调用 `PipelineExecutor.Execute` 替代 `ExecuteFsubmitScripts`。
- [ ] `Beijing` 和 `Hubei` 两个超算均能通过 pipeline 完成完整提交-下载流程。
- [ ] 任务成功完成后 `CaseModel.Status` 更新为 `success`。
- [ ] 任务失败时 `CaseModel.Status` 更新为 `failed` 并记录错误信息。
- [ ] 原有 `fsubmit` 调用代码被移除或明确标记为废弃。
- [ ] 后端能正常编译通过（`dotnet build`）。
- [ ] 单元测试通过，转换结果与 `cbaldur-backend/data/1/35/jobxdat` 逐字节一致。

## Out of Scope

- `ExecutePythonCode` 中用于 sandbox 执行 Python 绘图的 `fsubmit` 调用保持现状，不作为本次迁移内容。
- 不新增 pipeline 步骤类型；仅使用 `PipelineExecutor` 已支持的步骤。

## Notes

- 保留 `Others/fsubmit` 二进制文件及 `Others/config.json` 暂不移除，以免影响 `ExecutePythonCode` 或其他未迁移路径。是否清理可在后续独立任务中决定。

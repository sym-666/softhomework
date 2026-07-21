# 技术设计：CaseService 迁移到 PipelineExecutor

## 架构变更

```
Before:
CaseService.CreateCaseAsync / CreateCaseByNamelistAsync
  └─ ProcessCase / ProcessCaseByNamelist (后台 Task)
       └─ ExecuteCalculationTask / ExecuteCalculationTaskByNamelist
            ├─ WASM convert (cbaldur-json-to-nml)
            ├─ ExecuteFsubmitScripts (调用 Others/fsubmit CLI)
            │     ├─ mkdir
            │     ├─ submit
            │     └─ download
            └─ ProcessCsvFiles (本地 tar 解压 + YF.csv 清理)

After:
CaseService.CreateCaseAsync / CreateCaseByNamelistAsync
  └─ ProcessCase / ProcessCaseByNamelist (后台 Task)
       └─ ExecuteCalculationTask / ExecuteCalculationTaskByNamelist
            └─ PipelineExecutor.Execute
                  ├─ convert (pipeline YAML 中，仅 JSON 提交)
                  ├─ ssh_exec mkdir
                  ├─ ssh_upload
                  ├─ ssh_exec submit
                  ├─ ssh_download
                  └─ postprocess (untar + skip_lines)

> 注：`convert` 步骤在 YAML 中 `condition: json`，namelist 提交时会自动跳过；`PipelineExecutor` 已负责写入 `input.json`/`comment`/`jobxdat`，因此 `CaseService` 中不再保留本地 WASM convert 与文件写入逻辑。

## 依赖注入

`CaseService` 构造函数新增：

```csharp
private readonly PipelineExecutor _pipelineExecutor;
private readonly IPipelineService _pipelineService;
```

`Program.cs` 已注册：
- `registry.ForSingletonOf<IPipelineService>().Use<PipelineService>();`
- `registry.For<PipelineExecutor>().Use<PipelineExecutor>();`

因此注入后可直接使用，无需额外注册。

## 数据流

1. 用户调用 `CreateCaseAsync(userId, caseJson, prototype, comment, superComputer)` 或 `CreateCaseByNamelistAsync(userId, namelist, superComputer)`。
2. `CaseService` 创建 `CaseModel`，状态为 `running`，并启动后台 `Task`。
3. 后台任务准备本地目录 `{UserDir}/{userId}/{caseId}`（仅创建目录，文件写入由 `PipelineExecutor` 完成）：
   - JSON 提交：`PipelineExecutor` 写入 `input.json` 和 `comment`。
   - namelist 提交：`PipelineExecutor` 写入 `jobxdat`，并提取前 4 行作为 `comment`。
4. JSON 提交时，pipeline 的 `convert` 步骤执行 `cbaldur-json-to-nml` 生成 `jobxdat`。
5. 通过 `IPipelineService.GetSupercomputer("baldur", superComputer)` 获取超算定义。
   - 若未找到，记录错误并更新状态为 `failed`。
6. 调用 `_pipelineExecutor.Execute(sc, localDir, userId, caseId, isJsonSubmission, caseJson, comment, namelist)`。
7. `PipelineExecutor` 按 YAML 步骤执行：convert（可选）→ mkdir → upload → submit → download → postprocess。
8. `Execute` 完成后，更新 `CaseModel.Status` 为 `success`。
9. 若任何步骤抛出异常，捕获后更新 `CaseModel.Status` 为 `failed`，并记录异常信息到日志。

## 错误处理与状态一致性

- 当前 `CreateCaseAsync` 的 `try/catch` 只覆盖数据库插入，后台 `Task` 异常不会回滚状态。
- 迁移后，后台任务内需用 `try/catch` 包裹整个 `PipelineExecutor.Execute` 调用，确保：
  - 成功 → `Status = "success"`
  - 失败 → `Status = "failed"`
- 日志使用 `ILogger<CaseService>` 记录；当前 `CaseService` 未注入 logger，本次一并注入。

## 兼容性

- `CaseModel` 结构不变。
- `ICaseService` 接口不变。
- 前端调用方式不变。
- `Others/fsubmit` 和 `Others/config.json` 暂不删除，因为 `ExecutePythonCode` 仍依赖它们。
- `Schemas/baldur-pipeline.yml` 中 Beijing / Hubei pipeline 可直接复用；Beijing 的 `workdir` 已是当前 fsubmit 配置中的实际远程路径 `/publicfs01/fs1-t/home/sc80534/cbaldur_production/{userId}/{caseId}`，无需再修改。

## 风险点

1. `PipelineExecutor.Execute` 是同步阻塞方法，会长时间占用线程池线程。与当前 `ExecuteFsubmitScripts` 行为一致，无需额外改动。
2. `ssh_exec submit` 命令在 Beijing 配置中使用 `sbatch -W`（等待完成），在 Hubei 中使用同步执行命令；超时由 `SshExecConfig.Timeout = 0` 表示不超时，需确认 `Renci.SshNet` 对 `CommandTimeout = TimeSpan.Zero` 的处理是否符合预期。
3. `PipelineExecutor` 的 `postprocess` 步骤与 `ProcessCsvFiles` 行为不完全一致：若 pipeline 未配置 postprocess，则不会执行解压。需确保 Beijing / Hubei 两个 pipeline 都包含完整的 postprocess。

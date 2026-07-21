# 执行计划：CaseService 迁移到 PipelineExecutor

## 变更文件清单

1. `cbaldur-backend/Services/CaseService.cs` — 核心改造
2. `cbaldur-backend/Services/ICaseService.cs` — 无需改动（接口不变）
3. `cbaldur-backend/Program.cs` — 无需改动（DI 已注册）
4. `cbaldur-backend/Schemas/baldur-pipeline.yml` — 检查确认步骤完整性，可能需要微调

## 实施步骤

### 1. 注入依赖并添加日志

在 `CaseService` 中：
- 添加 `using Microsoft.Extensions.Logging;`
- 构造函数新增参数：`PipelineExecutor pipelineExecutor`、`IPipelineService pipelineService`、`ILogger<CaseService> logger`
- 新增只读字段保存上述依赖

### 2. 改造 `ExecuteCalculationTask`

- 移除本地 `cbaldur-json-to-nml` 转换逻辑；由 pipeline YAML 中的 `convert` 步骤统一执行。
- 移除 `ExecuteFsubmitScripts(dirPath, userId, caseId, superComputer)` 调用。
- 移除 `ProcessCsvFiles(dirPath)` 调用（由 pipeline postprocess 替代）。
- 新增调用（需将 `caseJson`、`comment` 传入后台任务）：
  ```csharp
  var sc = _pipelineService.GetSupercomputer("baldur", superComputer);
  if (sc == null)
  {
      throw new InvalidOperationException($"未找到超算配置: {superComputer}");
  }
  _pipelineExecutor.Execute(sc, dirPath, userId, caseId, isJsonSubmission: true, caseJson, comment);
  ```
- 用 `try/catch` 包裹整个执行流程，成功后更新 `Status = "success"`，失败后更新 `Status = "failed"` 并记录日志。

### 3. 改造 `ExecuteCalculationTaskByNamelist`

- 移除 `jobxdat` 写入逻辑；由 `PipelineExecutor` 根据 `namelist` 直接写入。
- 移除 `ExecuteFsubmitScripts` 和 `ProcessCsvFiles` 调用。
- 调用 `_pipelineExecutor.Execute` 时传入 `isJsonSubmission: false` 和 `namelist`。
- 同样需要 `try/catch` 更新状态。

### 4. 清理旧代码

- 删除 `ExecuteFsubmitScripts` 方法。
- 删除 `ProcessCsvFiles` 方法。
- 删除 `CaseService.ProcessComment` 静态方法（`PipelineExecutor` 已提供等效实现）。
- 可选：移除 `ProcessCase` / `ProcessCaseByNamelist` 中对 `input.json`/`comment`/`jobxdat` 的本地写入，统一交给 `PipelineExecutor`。
- 保留 `Others/fsubmit` 和 `Others/config.json` 文件本身，仅移除 C# 代码中的引用。

### 5. 验证 `baldur-pipeline.yml`

- 确认 Beijing / Hubei 的 postprocess 都包含 `untar`（all_csv.tar、gfile.tar）和 `skip_lines`（YF.csv，2 行）。
- 确认 convert 步骤 `condition: json`，不影响 namelist 提交。
- 确认 Beijing 的 `workdir` 与当前 fsubmit 配置一致（当前 YAML 已是 `/publicfs01/fs1-t/home/sc80534/cbaldur_production/{userId}/{caseId}`，无需修改）。

### 6. 新增转换一致性单元测试

- 创建/复用 .NET 测试项目（如 `cbaldur-backend.Tests`）。
- 以 `cbaldur-backend/data/1/35/input.json` 与 `cbaldur-backend/data/1/35/comment` 作为 fixture。
- 在测试中调用 `cbaldur-json-to-nml -j input.json -c comment -n actual_jobxdat`，生成实际 `jobxdat`。
- 将生成的 `actual_jobxdat` 与 `cbaldur-backend/data/1/35/jobxdat` 逐行/逐字节比较，断言两者完全一致。
- 运行 `dotnet test` 验证测试通过。

### 7. 编译验证

运行：
```bash
cd cbaldur-backend
dotnet build
```

## 验证清单

- [ ] `dotnet build` 无错误。
- [ ] `dotnet build` 无新增警告。
- [ ] `CaseService` 不再包含 `fsubmit` 字符串引用。
- [ ] `CaseService` 成功注入 `PipelineExecutor`、`IPipelineService`、`ILogger<CaseService>`。
- [ ] `ExecuteCalculationTask` 和 `ExecuteCalculationTaskByNamelist` 均调用 `_pipelineExecutor.Execute`。
- [ ] 单元测试通过，`actual_jobxdat` 与 `cbaldur-backend/data/1/35/jobxdat` 完全一致。

## 回滚点

- 若迁移后提交行为异常，可回滚 `CaseService.cs` 到本次修改前的版本（`git checkout -- cbaldur-backend/Services/CaseService.cs`）。
- `Others/fsubmit` 文件未删除，回滚后旧路径可立即恢复。

## 后续跟进

- 迁移完成后观察线上提交成功率。
- 稳定后可考虑将 `ExecutePythonCode` 的 sandbox 调用也纳入 pipeline，并删除 `Others/fsubmit`。

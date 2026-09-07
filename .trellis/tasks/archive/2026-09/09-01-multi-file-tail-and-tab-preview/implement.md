# 执行计划 (Implementation Plan)

## 阶段一：Pipeline 规范与模型层改造
- [x] 1.1 更新 `cbaldur-backend/Schemas/pipeline-schema.json`：为 `ssh_exec` 添加 `tail_files` (array of strings) 并替换旧的 `tail_file`。
- [x] 1.2 更新 `cbaldur-backend/Schemas/baldur-pipeline.yml`：为 `Beijing` 与 `Hubei` 的 `submit` 步骤配置 `tail_files: ["{workdir}/jobxlpt", "{workdir}/cbaldur.out"]`。
- [x] 1.3 更新 `cbaldur-backend/Models/PipelineModel.cs`：在 `SshExecConfig` 中将 `TailFile` 替换为 `TailFiles` (`List<string>?`)。

## 阶段二：后端执行器与多文件增量轮询
- [x] 2.1 更新 `cbaldur-backend/Services/ICaseLogNotifier.cs`：在 `CaseLogEvent` 与 `ICaseLogNotifier` 中增加 `File` 字段与参数。
- [x] 2.2 更新 `cbaldur-backend/Services/CaseLogBroker.cs`：支持存储带 `file` 标记的日志事件，并在 `GetBufferedLogs` 中支持按文件或全量返回。
- [x] 2.3 重构 `cbaldur-backend/Services/PipelineExecutor.cs`：
  - 启动针对多个 `tail_files` 的 SFTP 轮询循环；
  - 独立维护每个目标文件的 `lastOffset`，将增量内容分别写入 `localDir/{fileName}`；
  - 调用 `NotifyLogLine` 时带上对应的文件名（如 `jobxlpt`、`cbaldur.out`）或 `"pipeline"`。
- [x] 2.4 更新 `cbaldur-backend/Controllers/CaseController.cs`：
  - SSE 端点 `LogEvents` 序列化增加 `file` 字段；
  - REST 端点 `Logs` 支持返回 `files` 与 `logsByFile` 字典，以及兼容旧版 `logs` 字段。
- [x] 2.5 编写/更新后端测试 `CBaldurBackendREST.Tests/CaseLogBrokerTests.cs` 与 `PipelineExecutorTests`。

## 阶段三：前端状态管理与 Hook 升级
- [x] 3.1 更新 `cbaldur-frontend-next/src/redux/api/case.ts`：更新 `GetCaseLogsResponse` 类型定义，包含 `files` 和 `logsByFile`。
- [x] 3.2 更新 `cbaldur-frontend-next/src/hooks/useCaseLogEvents.ts`：
  - SSE 事件解析 `file` 字段；
  - 维护 `logsByFile` 字典、`files` 可用文件列表以及全局 `logs`；
  - 提供清空与重连支持。

## 阶段四：前端控制台 UI 与 Tab 交互开发
- [x] 4.1 升级 `cbaldur-frontend-next/src/components/cases/CaseLogTerminal.tsx`：
  - 引入多 Tab 切换栏（Tabs），支持 `全部汇总 (All)` 与各独立文件 Tab；
  - Tab 标签展示该文件对应行数 Badge；
  - 关键词搜索、高亮、复制与下载均针对当前激活 Tab；
  - 自动滚动与全屏功能针对当前 Tab 平滑生效。
- [x] 4.2 更新 `cbaldur-frontend-next/src/routes/cases/Case.tsx`：
  - 将多文件实时数据和历史日志数据传入 `CaseLogTerminal`；
  - 统一更新实时监控卡片与历史日志弹窗中的终端展示。

## 阶段五：全面验证与回归测试
- [x] 5.1 运行后端单元测试 `dotnet test`，确保全部通过。
- [x] 5.2 运行前端规范检查 `npm run lint` 与构建打包 `npm run build`，确保无任何编译与类型错误。

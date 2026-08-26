# 执行计划 (Implementation Plan)

## 1. 后端改造 (Backend)

- [x] 1.1 在 `CBaldurBackendREST/Services/CaseService.cs` 中增加 `CaseExecutionContext` 结构与 `ConcurrentDictionary<Guid, CaseExecutionContext>` 注册机制
- [x] 1.2 改造 `PipelineExecutor.cs`，接收 `CaseExecutionContext` 与 `CancellationToken`，在 `ExecuteSshExec` / SFTP 中支持协作式取消与超时中断
- [x] 1.3 在 `CaseService.cs` 与 `ICaseService.cs` 实现 `TerminateCaseAsync(Guid currentUserId, Guid caseId)` 逻辑
- [x] 1.4 在 `CaseController.cs` 中新增 `[HttpPost] public async Task<IActionResult> TerminateCase([FromBody] TerminateCaseBody body)` 端点
- [x] 1.5 编写与更新后端单元测试（覆盖终止权限校验、状态流转与取消逻辑）

## 2. 前端改造 (Frontend)

- [x] 2.1 在 `src/redux/api/case.ts` 中新增 `terminateCase` mutation
- [x] 2.2 封装 Pipeline 步骤解析与进度指示器组件 `src/components/cases/PipelineStepStepper.tsx`
- [x] 2.3 升级重构 `src/components/cases/CaseLogTerminal.tsx`，适配全局主题、搜索过滤、丰富语义高亮与沉浸式体验
- [x] 2.4 改造 `src/routes/cases/Case.tsx` 中的运行中/失败状态渲染视图，集成 Ribbon 工具栏、元数据指标卡片、计时器、步骤条与终止二次确认 Dialog
- [x] 2.5 检查并美化历史日志弹窗（`showLogModal`）与多语言文本（zh-CN / en）

## 3. 验证与质量保证 (Validation & Quality Gate)

- [x] 3.1 运行后端单元测试 `dotnet test`，确保全部通过
- [x] 3.2 运行前端类型检查 `npm run build` 或 `npx tsc --noEmit` 与代码规范检查 `npm run lint`
- [x] 3.3 验证算例提交后的实时渲染视觉效果与明暗主题自适应表现
- [x] 3.4 验证主动切断终止功能端到端流程与异常处理

## 4. 关键风险与回滚方案
- **关键文件**：
  - `cbaldur-backend/Services/PipelineExecutor.cs`
  - `cbaldur-backend/Services/CaseService.cs`
  - `cbaldur-backend/Controllers/CaseController.cs`
  - `cbaldur-frontend-next/src/routes/cases/Case.tsx`
  - `cbaldur-frontend-next/src/components/cases/CaseLogTerminal.tsx`
- **回滚点**：
  - 若取消指令导致 SSH 连接池异常，可通过 `_activeExecutions` 安全 `try/catch` 隔离；
  - 若前端布局冲突，可平滑回退至原单卡片布局。

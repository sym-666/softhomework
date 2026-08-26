# Implementation Plan: Realtime Case Execution Output Log

---

## 1. Backend Services & Broker

- [x] 1.1 创建 `Models/CaseLogEvent.cs` 与 `Services/ICaseLogNotifier.cs` / `Services/ICaseLogEventSource.cs` 接口与事件模型
- [x] 1.2 实现 `Services/CaseLogBroker.cs`，支持内存环形缓冲区 (In-Memory Ring Buffer) 与 SSE Channel 事件广播及清理
- [x] 1.3 在 `Program.cs` 中注册 `CaseLogBroker` 为单例，提供 `ICaseLogNotifier` 与 `ICaseLogEventSource`

---

## 2. Pipeline 日志采集与超算集成

- [x] 2.1 修改 `Schemas/baldur-pipeline.yml`，在 `download` 步骤中增加 `jobxlpt` 的持久化下载
- [x] 2.2 修改 `Services/PipelineExecutor.cs`，注入 `ICaseLogNotifier`，在 `submit` 步骤并发 Tail 读取 `{workdir}/jobxlpt` 并分发步骤事件
- [x] 2.3 修改 `Services/CaseService.cs`，在 Pipeline 执行成功与失败时发送 `NotifyLogCompleted` 终止信号

---

## 3. Backend REST & SSE Endpoints

- [x] 3.1 在 `CaseController.cs` 中新增 `GET /api/Case/LogEvents?id={id}` (SSE 流式端点，支持租户鉴权与心跳保活)
- [x] 3.2 在 `CaseController.cs` 中新增 `GET /api/Case/Logs?id={id}` (REST 接口，支持已完成算例与运行中日志查询)
- [x] 3.3 编写 `CaseLogBrokerTests.cs` 单元测试，验证缓冲回放、实时推送与租户权限隔离

---

## 4. Frontend Hook & Components

- [x] 4.1 在 `src/redux/api/case.ts` 中增加 `getCaseLogs` Query 端点与类型定义
- [x] 4.2 创建 `src/hooks/useCaseLogEvents.ts` 自定义 Hook，封装 SSE 实时日志流连接与状态管理
- [x] 4.3 创建 `src/components/cases/CaseLogTerminal.tsx`，实现暗色终端组件（行号、状态指示、自动滚屏跟随、复制、下载）

---

## 5. Frontend Routes & UX Links

- [x] 5.1 修改 `src/routes/cases/Case.tsx`，当 `status === 'running'` 时渲染 `CaseLogTerminal`；完成时平滑切换图表；并在 Ribbon 工具栏提供历史日志弹窗
- [x] 5.2 修改 `src/routes/cases/index.tsx`，解禁「详细信息」按钮在 `running` 与 `failed` 状态下的点击限制
- [x] 5.3 修改 `DynamicCommentPage.tsx`、`json.tsx`、`namelist.tsx`，提交成功后自动导航至新算例详情页

---

## 6. Quality & Verification

- [x] 6.1 `dotnet build` & `dotnet test` 全部通过（22 个测试用例全绿）
- [x] 6.2 `cbaldur-frontend-next` `npm run build` 与 ESLint 检查全部通过（0 errors, 0 warnings）

# PRD: Realtime Case Execution Output Log (实时算例运行日志)

## 1. Goal

在用户提交算例（动态表单 / JSON / Namelist）后、后端执行超算 Pipeline 期间，实时采集超算工作目录下的 `jobxlpt` 输出日志并推送到前端展示，让用户能够实时感知算例计算进度与运行状态；计算完成后平滑过渡至数据分析视图，并归档保存完整日志以供历史回溯查看。

---

## 2. Background & Evidence

- **Pipeline 运行机制** (`cbaldur-backend/Services/PipelineExecutor.cs`, `cbaldur-backend/Schemas/baldur-pipeline.yml`):
  - 算例提交后由后端异步执行 Pipeline（`convert` -> `mkdir` -> `upload` -> `submit` -> `download` -> `postprocess`）。
  - 超算端（BSCC-T / MHD）在 `{workdir}` 中执行 `cbaldur` 时持续输出日志到 `jobxlpt`。
  - 目前 `baldur-pipeline.yml` 的 `download` 步骤仅下载了 `all_csv.tar` 和 `gfile.tar`，未持久化 `jobxlpt`。
- **通信架构** (`cbaldur-backend/Services/CaseStatusBroker.cs`, `cbaldur-backend/Controllers/CaseController.cs`):
  - 系统已建立基于 SSE (`text/event-stream`) 的实时通信通道与规范 (`.trellis/spec/backend/case-status-sse-contract.md`)，采用 Cookie JWT 鉴权与 In-Process Channel 广播。
- **前端页面与交互** (`cbaldur-frontend-next/src/routes/cases/index.tsx`, `cbaldur-frontend-next/src/routes/cases/Case.tsx`, `DynamicCommentPage.tsx`, `json.tsx`, `namelist.tsx`):
  - 列表页 `/cases` 中的「详细信息」按钮当前在 `row.status !== 'success'` 时被禁用。
  - 提交成功后需要直接导航到当前算例详情页 `/cases/:userId/:caseUuid`。

---

## 3. Requirements & Scope

### 3.1 算例列表与提交导航 (Frontend Navigation)
- **解禁「详细信息」按钮** (`cases/index.tsx`):
  - 移除 `disabled={row.status !== 'success'}` 限制，允许 `running`、`success`、`failed` 状态下均可点击「详细信息」进入 `/cases/:userId/:caseId`。
- **提交后直接跳转详情** (`DynamicCommentPage.tsx`, `json.tsx`, `namelist.tsx`):
  - 算例提交成功后，从返回的 `{ id, caseId }` 和当前用户状态，直接调用 `setLocation('/cases/' + userId + '/' + id)` 进入详情页。

### 3.2 详情页运行中与日志视图 (Frontend Log View)
- **详情页实时日志终端** (`cases/Case.tsx`, 新增 `CaseLogTerminal` 组件):
  - 当算例状态为 `running` 时，主视图展示实时日志终端，显示 Pipeline 步骤（如配置转换、文件上传、超算任务排队/执行）以及实时 `jobxlpt` 内容。
  - 支持终端样式控制台：暗色主题、等宽字体、行号/时间戳、自动滚屏跟随与手动滚动暂停、一键复制/清空、状态指示徽标。
  - 接入 SSE 日志流 (`/api/Case/LogEvents?id={id}`)，并同时监听算例状态变更 (`useCaseStatusEvents`)。
  - 计算成功（`success`）时自动提示完成并刷新加载 CSV 绘图分析面板；计算失败（`failed`）时在终端高亮显示错误详情与诊断信息。
- **已完成算例日志回溯**:
  - 在已完成算例的详情页 Ribbon 工具栏（如“工具”分组中）提供「查看运行日志」按钮，点击弹出日志弹窗/抽屉以回溯完整 `jobxlpt`。

### 3.3 后端日志采集与实时推送 (Backend Pipeline & Log Broker)
- **实时日志采集 (Live Tail/Polling)**:
  - 在 `PipelineExecutor.cs` 中，为算例创建执行期日志收集上下文 `CaseLogContext`。
  - 在 `submit` 步骤（或整个 Pipeline 执行期），并发后台通过 SFTP 或 SSH 定期 Tail 读取远程工作目录中的 `jobxlpt` 增量内容。
  - 结合 Pipeline 步骤事件（例如 `[Pipeline] Step 1/5: 正在转换参数...`、`[Pipeline] Step 3/5: 作业已提交，正在计算...`），实时向 `ICaseLogBroker` 发送日志行。
- **实时日志 SSE 接口**:
  - 新增 `GET /api/Case/LogEvents?id={id}` (SSE 端点)，校验 Cookie JWT 鉴权与租户权限（仅本人或管理员可访问）。
  - 支持首连回放已产生的历史缓冲（Buffer），随后持续流式推送增量行；Pipeline 结束时发送完成通知并正常关闭。
- **日志持久化与离线查询**:
  - 在 `baldur-pipeline.yml` 的 `download` 步骤或 `PipelineExecutor` 后处理中，将最终 `jobxlpt` 同步保存至本地存储 `{userDir}/{userId}/{caseId}/jobxlpt`。
  - 新增 `GET /api/Case/Logs?id={id}` REST 端点，供离线/已完成算例直接获取完整的执行日志文本。

---

## 4. Acceptance Criteria

- [x] 在 `/cases` 算例列表页中，处于 `running`、`success` 或 `failed` 状态的算例，「详细信息」按钮均可正常点击并进入详情页。
- [x] 算例在动态表单 / JSON / Namelist 提交成功后，直接跳转至该算例的 `/cases/:userId/:caseId` 详情页。
- [x] 进入 `running` 算例详情页时，实时日志终端展示 Pipeline 步骤进度和持续流式输出的 `jobxlpt` 内容。
- [x] 算例在后台计算完成后，详情页自动接收到完成事件并切换至绘图分析面板；若失败则展示错误原因。
- [x] 在已完成算例的详情页中，通过 Ribbon 工具栏可调出完整历史日志。
- [x] 算例执行结束后，本地存储目录保存有完整的 `jobxlpt` 文件。
- [x] 权限隔离：普通用户无法订阅或查看非本人的算例日志。
- [x] 后端单元测试覆盖 `CaseLogBroker`、日志权限鉴权与安全校验；前端通过 TypeScript 类型检查与 Lint。




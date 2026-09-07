# 优化算例实时预览界面并支持主动终止运行

## Goal

在算例提交后及计算运行期间，提供与全局主题（Office/Fluent 风格、自适应明暗模式、shadcn/ui 体系）高度统一的算例实时预览与监控界面；同时赋予用户在计算过程中主动切断/终止后端与超算任务执行的能力，完善算例完整生命周期控制。

## Confirmed Facts

1. 前端在算例创建成功后（动态表单 / JSON / Namelist），均会跳转至 `/cases/:userId/:caseId` 路由。
2. 当算例状态为 `running` 或 `failed` 时，`Case.tsx` 渲染实时监控与日志终端界面；当状态转为 `success` 时，平滑过渡至 ECharts 拓扑与数据分析视图。
3. 后端通过 `CaseLogBroker` (SSE) 提供实时 `jobxlpt` 与 Pipeline 步骤流式日志，通过 `CaseStatusBroker` 提供算例状态变更通知。
4. 当前的实时预览界面在 Office/Fluent 整体框架下存在以下视觉与交互缺陷：
   - 终端采用了硬编码纯黑背景与特定样式，缺乏与全局主题（明暗主题、设计规范、边框阴影、卡片分层）的深度适配。
   - 缺少直观的 Pipeline 阶段步骤进度可视化（如配置转换 → 文件上传 → 超算排队/计算 → 结果下载 → 后处理）。
   - 缺少运行耗时统计（计时器）、算例元数据摘要卡片（超算节点、创建时间、备注等）。
5. 当前后端超算任务通过 `PipelineExecutor` 在后台线程中同步执行 SSH/SFTP 指令，尚未注册全局执行上下文（`CaseExecutionContext`）及取消令牌（`CancellationToken`），前端亦无切断或取消计算的入口。

## Requirements

### 1. 实时预览与监控界面美化 (UI/UX)
- **主题与视觉统一**：
  - 界面完全遵循 Office/Fluent 设计规范与 Tailwind CSS 4 / shadcn 主题变量体系，支持浅色/深色模式下的精致显示。
  - 顶部与应用整体 Ribbon 栏和谐衔接，提供算例运行态专用的 Ribbon 工具栏分组（包含「返回列表」、「刷新」、「终止计算」等快捷操作）。
- **运行状态与指标卡片 (Metrics & Info)**：
  - 算例基本信息展示：算例 ID、超算中心（BSCC-T / MHD）、提交时间、实时运行耗时计时器（HH:MM:SS 动态更新）。
  - 动态状态胶囊（运行中 [呼吸灯动效] / 已完成 / 计算失败 / 已主动终止）。
- **Pipeline 流程步骤条 (Pipeline Step Stepper)**：
  - 阶段可视化：参数转换 → 远程目录与文件上传 → 超算作业排队与计算 (`jobxlpt`) → 结果下载与归档 → 完成。
  - 实时根据 SSE 推送的 `[Pipeline]` 步骤信息高亮当前处于哪一步，并显示各步骤成功/等待/错误状态。
- **现代化日志终端体验 (CaseLogTerminal 增强)**：
  - 更加精致的终端外框、行号槽、文字排版与高亮配色（针对 Pipeline 标签、WARNING、ERROR、迭代 step、耗时等不同日志类型做语义染色）。
  - 快捷工具栏：实时自动滚动切换（开启/暂停）、一键复制全文、下载日志文件、关键词搜索过滤、全屏展开模式。
- **历史日志弹窗同步美化**：
  - 算例完成后的 Ribbon「查看运行日志」弹窗复用升级后的终端组件，保持体验一致。

### 2. 主动切断/终止计算功能 (Active Termination)
- **后端执行终止与资源释放**：
  - `CaseService` 维护运行中算例的执行上下文 `ConcurrentDictionary<Guid, CaseExecutionContext>`。
  - `PipelineExecutor` 接受 `CancellationToken`，在执行 SSH 阻塞命令与 SFTP Tail 循环时支持即时响应取消。
  - 取消触发时：
    1. 立即取消正在运行的 `CancellationTokenSource` 并中断 SSH 命令；
    2. 若超算端已提交 Slurm/进程任务，执行远程清理（如 `scancel` / 中止进程）；
    3. 安全关闭并断开 SSH/SFTP 连接；
    4. 记录日志：`[Pipeline WARNING] 任务已被用户主动切断终止`；
    5. 更新数据库算例状态为 `failed`（或 `terminated`），附带终止备注；
    6. 通过 `ICaseStatusNotifier` 与 `ICaseLogNotifier` 即时向所有监听客户端分发状态变更与完成事件。
- **后端终止接口**：
  - `CaseController` 提供 `POST /api/Case/TerminateCase`（或 `CancelCase`）端点，受 JWT 鉴权与算例所有权验证保护。
- **前端终止操作与防误触交互**：
  - 在实时预览监控界面提供醒目的「终止计算」按钮（Danger 红色风格）。
  - 点击弹出二次确认 AlertDialog 对话框，明确提示终止后果（超算任务将中断，中间未完成结果不保存）。
  - 确认后发送终止请求，按钮进入 loading 状态，终止成功后即时 Toast 提示并切换视图状态为已终止。

## Acceptance Criteria

- [x] 算例提交后进入详情页，界面整体风格与 Office/Fluent 及全局主题无缝融合，明暗模式切换自然。
- [x] 顶部展示算例运行元数据卡片（算例编号、超算节点、创建时间、实时耗时秒表）及动态状态徽章。
- [x] 页面展示 Pipeline 步骤进度条，随着后端 SSE 事件流实时推进当前步骤高亮。
- [x] 日志终端支持语义高亮、自动滚动切换、复制、下载以及搜索过滤功能。
- [x] 算例运行期间，点击「终止计算」弹出二次确认弹窗；确认后调用后端 API 成功终止超算任务。
- [x] 终止后，终端输出终止提示日志，算例状态更新为失败/终止，按钮置灰不可再次操作，SSE 连接平稳关闭。
- [x] 算例详情页已完成状态下的历史日志弹窗同样使用优化后的终端组件，视觉规范统一。
- [x] 后端单元测试覆盖终止逻辑与安全权限校验，前端通过类型检查与构建。

## Out of Scope

- 超算端任务的断点续算或状态快照恢复（当前超算任务一旦切断即完全中止）。
- 对已执行完成（success）或已失败（failed）算例的终止操作。

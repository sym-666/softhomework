# Journal - eziosweet (Part 1)

> AI development session journal
> Started: 2026-07-14

---



## Session 1: 完成以此为模板新建

**Date**: 2026-07-14
**Task**: 完成以此为模板新建
**Branch**: `feature/param-search`

### Summary

实现算例列表「以此为模板新建」：Namelist 走 caseId 预填，动态路径 Redux 注入 CaseJsonPrototype 后进入 baldur 分步创建；.gitignore 忽略 Trellis/agent 脚手架，AGENTS.md 提交规范改为 Conventional Commits。

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `586cdb2` | (see git log) |
| `9098286` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 2: 结果绘图时间演进动图

**Date**: 2026-07-14
**Task**: 结果绘图时间演进动图
**Branch**: `feature/param-search`

### Summary

Case 结果绘图增加独立动图开关：1D/eq2D 预加载全时段后 ECharts 本地换帧播放（播放/暂停/滑条/全局坐标轴），并完成质量检查与提交。

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `eba5069` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 3: Analyze 功能区布局优化与 Ribbon i18n

**Date**: 2026-07-14
**Task**: Analyze 功能区布局优化与 Ribbon i18n
**Branch**: `feature/param-search`

### Summary

移除 Analyze 占位文案使工具栏上移；统一图标上文字下；接入 Ribbon/StatusBar 中英文；新增二级功能区折叠。

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `0c41ec0` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 4: 逐步输入参数关系图编辑器

**Date**: 2026-07-14
**Task**: 逐步输入参数关系图编辑器
**Branch**: `feature/param-search`

### Summary

在逐步输入页面为 short_array 参数新增参数关系图 Dialog：选 1 个 X + 多个 Y，用 ECharts 折线图双向编辑，支持拖拽（整数吸附）、输入联动、长度不一致 warning、撤回（按钮/Ctrl+Z）。

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `6839ed5` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 5: Extend parameter analysis variables

**Date**: 2026-07-14
**Task**: Extend parameter analysis variables
**Branch**: `feature/param-search`

### Summary

Extended one-dimensional analysis formulas with menu-inserted variable aliases, row-aligned auxiliary plot columns, and animation support. Verified backend build, targeted frontend lint, and frontend production build.

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `9e9093a` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 6: CaseService → PipelineExecutor 迁移并对齐逐步输入

**Date**: 2026-07-21
**Task**: CaseService → PipelineExecutor 迁移并对齐逐步输入
**Branch**: `master`

### Summary

将 CaseService 计算提交从 fsubmit 迁到 PipelineExecutor；补齐 auxiliary-heating（nlpomt 长数组 + elementType bool）使逐步输入默认与 namelist 一致；强制 comment 恰好四行；新增 jobxdat 转换一致性单测。联调对比 157/158/159/160 验证通过。

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `735e910` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 7: 跟踪 Agent 脚手架并提交 PR #25

**Date**: 2026-07-21
**Task**: 跟踪 Agent 脚手架并提交 PR #25
**Branch**: `feature/case-pipeline-and-agent-scaffolding`

### Summary

放宽 .gitignore，纳入 .trellis/.claude/.codex/.cursor/.agents/.opencode；新建分支 feature/case-pipeline-and-agent-scaffolding 并创建 PR #25。migrate 任务此前已归档。

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `05024c4` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 8: GetCases list payload + case comparison kickoff

**Date**: 2026-07-21
**Task**: GetCases list payload + case comparison kickoff
**Branch**: `feature/case-pipeline-and-agent-scaffolding`

### Summary

Finished lightweight GetCases/GetCasesForAdmin CaseListItem DTO (backend projection + frontend types/lazy GetCase for JSON template). Documented case-list-payload-contract in .trellis/spec. Next: fix broken case-comparison plot mode (nowCases has no setter/UI).

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `366c68d` | (see git log) |
| `93bc927` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 9: Fix case-comparison plot selection

**Date**: 2026-07-21
**Task**: Fix case-comparison plot selection
**Branch**: `feature/case-pipeline-and-agent-scaffolding`

### Summary

Restored case-comparison mode on the case plot page: setNowCases + success-case sidebar with per-case multi time select, seeded current case/nowTime, effectiveNowCases for GetPlotAcrossCases/CSV. Documented frontend case-plot-comparison convention.

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `1c6f818` | (see git log) |
| `f2d8f8a` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 10: Cases realtime SSE refresh

**Date**: 2026-07-21
**Task**: Cases realtime SSE refresh
**Branch**: `feature/case-pipeline-and-agent-scaffolding`

### Summary

Added SSE StatusEvents + in-process broker; AuthGuard EventSource invalidates Case tags for /cases and home; documented case-status-sse-contract.

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `c88c17a` | (see git log) |
| `7847ae5` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 11: C# JSON→namelist converter and sandbox cleanup

**Date**: 2026-07-21
**Task**: C# JSON→namelist converter and sandbox cleanup
**Branch**: `feature/case-pipeline-and-agent-scaffolding`

### Summary

Replaced cbaldur-json-to-nml with JsonToNmlConverter, disabled plot sandbox, removed Others binaries except keys, dropped legacy path config; verified 163/166 CSV parity.

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `b5477ab` | (see git log) |
| `e0431b4` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 12: Migrate MySQL to PostgreSQL (auth/cbaldur schemas)

**Date**: 2026-07-23
**Task**: Migrate MySQL to PostgreSQL (auth/cbaldur schemas)
**Branch**: `feature/pgsql`

### Summary

Switched FreeSql from MySQL to PostgreSQL with auth/cbaldur schemas, compose/docs/config updates, and fixed GetCases jsonb empty-string comparison (22P02).

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `82d32c2` | (see git log) |
| `27b02da` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 13: Case UUID + BYTEA avatar

**Date**: 2026-07-23
**Task**: Case UUID + BYTEA avatar
**Branch**: `feature/pgsql`

### Summary

Shipped per-user caseId with UUID case PK/API/disk paths, and avatar BYTEA via GET /api/User/Avatar. Archived parent+child Trellis tasks.

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `5bab865` | (see git log) |
| `9b7eac7` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 14: All entity PKs to UUID

**Date**: 2026-07-27
**Task**: All entity PKs to UUID
**Branch**: `feature/pgsql`

### Summary

Migrated users/orgs/notices PKs and FKs to UUID; JWT Guid claims; status bar shows per-user caseId.

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `51a5a73` | (see git log) |
| `c30742a` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 15: Plot UX fixes: animation, legends, expressions

**Date**: 2026-07-27
**Task**: Plot UX fixes: animation, legends, expressions
**Branch**: `feature/plot-ux-fixes`

### Summary

Fixed profile animation via exact GetTimes CSV token matching; hid YF animation; case legends as #id @ time; clarified XY x/y/vN UX and formula labels; removed gfile from plot types. Specs updated for CSV resolution and gfile.

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `b920977` | (see git log) |
| `c35040a` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 16: Fix JSON add-cases upload/export defaults

**Date**: 2026-07-27
**Task**: Fix JSON add-cases upload/export defaults
**Branch**: `feature/plot-ux-fixes`

### Summary

Repaired JSON create-case upload/download/sync, schema defaults, configName routing, and in-page createCase; documented add-cases JSON path contracts.

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `6d2538e` | (see git log) |
| `49f3b13` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 17: Realtime Case Execution Output Log

**Date**: 2026-08-26
**Task**: Realtime Case Execution Output Log
**Branch**: `feature/realtime-case-execution-log`

### Summary

支持算例提交后在详情页通过 SSE 实时流式监控超算 jobxlpt 日志输出与 Pipeline 步骤进度；Pipeline 执行共用长连接并在 submit 步骤并发增量 tail jobxlpt；计算完成后自动过渡至 ECharts 分析视图并在 Ribbon 工具栏提供历史日志弹窗；算例列表解除运行中点击限制；提交后自动跳转详情。

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `f603561` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 18: 优化算例实时预览界面并支持配置化主动终止计算任务

**Date**: 2026-08-26
**Task**: 优化算例实时预览界面并支持配置化主动终止计算任务
**Branch**: `feature/realtime-case-execution-log`

### Summary

完成了算例提交后实时监控界面美化（PipelineStepStepper 5阶段指示器 + CaseLogTerminal 现代化终端控制台），实现了前后端协同的主动切断计算运行功能。取消逻辑全面接入 Pipeline Schema 与 YAML 配置化驱动（北京超算 Slurm 作业取消与湖北超算 PID 进程切断），支持独立的 'terminated' 状态与琥珀橙色视觉设计，并完善了切断前后 jobxlpt 日志的实时持久化与控制台回显查看。

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `342fbad` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete


## Session 19: 支持多文件 tail-file 追踪、多 Tab 控制台与高性能虚拟滚动渲染

**Date**: 2026-09-01
**Task**: 支持多文件 tail-file 追踪、多 Tab 控制台与高性能虚拟滚动渲染
**Branch**: `feature/realtime-case-execution-log`

### Summary

扩展 pipeline tail_files 多文件追踪，支持后端并发 SFTP 增量读取与本地持久化；前端提供多 Tab 切换、轻量级虚拟滚动视口（Virtual Windowing）与 60ms SSE 微批次合并，彻底消除数万行日志卡顿；优化绘图页运行日志弹窗布局并移除冗余重置按钮。

### Main Changes

- Detailed change bullets were not supplied; see the summary above.

### Git Commits

| Hash | Message |
|------|---------|
| `6b00e0a` | (see git log) |

### Testing

- Validation was not recorded for this session.

### Status

[OK] **Completed**

### Next Steps

- None - task complete

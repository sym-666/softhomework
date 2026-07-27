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

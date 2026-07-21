# 修复算例对比绘图

## Goal

让算例详情页「算例对比」模式可以正常选算例、为每算例多选时间、拉数出图，并支持同模式 CSV 导出。

## Background

- 入口：`cbaldur-frontend-next/src/routes/cases/Case.tsx`，`nowMode === 'case'`。
- 根因：约 L124 `nowCases` 无 setter，恒为 `[]`；侧栏无算例/时间选择 UI（时间对比已有完整 checkbox 模式可对齐）。
- 拉数与导出链路已存在：`GetPlotAcrossCases` / `DownloadPlotCsvAcrossCases`；后端系列标记为 `time = "{caseId}:{time}"`；前端 `pivotBySeriesXOccurrence` 生成 `${y}_{caseId:time}`。
- 候选列表可用轻量 `GetCases` → `CaseListItem`；各算例时间用现有 `GetTimes`。成功态为 `status === 'success'`。
- eq2D / 动图下算例对比按钮已禁用，保持不变。

## Requirements

- R1: 每算例多时间——勾选算例后可多选该算例时间；状态形状为 `{ caseId, times: string[] }[]`，对接既有 API。
- R2: 候选来自当前用户 `GetCases`，包含当前算例，且仅 `status === 'success'`。
- R3: 切入「算例对比」时，默认勾选当前算例，并预填当前单片时间（`nowTime`，若存在）。
- R4: 已选 X/Y 且 `nowCases` 中至少一项 `times.length > 0` 时出图；CSV 走跨算例下载且与当前选择一致。
- R5: 列表展示用 `id` + `comment`（或等价可读标签）；图例可继续用后端 `{caseId}:{time}`（本任务不改后端标记格式）。

## Acceptance Criteria

- [ ] AC1: 切到「算例对比」后侧栏列出含当前算例的成功算例；可勾选/取消，并为每个已选算例多选时间（含全选/清空时间，交互对齐时间对比）。
- [ ] AC2: 切入模式时当前算例已勾选，且若 `nowTime` 有值则已出现在该算例的 `times` 中。
- [ ] AC3: 满足 R4 时图表经 `GetPlotAcrossCases` 绘制多系列；清空选择后图表清空或不再请求。
- [ ] AC4: 算例对比下 CSV 导出走 `DownloadPlotCsvAcrossCases`，内容与当前 `nowCases` / 轴选择一致。
- [ ] AC5: eq2D 或动图开启时不可启用算例对比（现状保持）。
- [ ] AC6: 前端 `npm run lint` 通过。

## Out of Scope

- 修改 `GetPlotAcrossCases` 服务算法或跨用户目录读取
- eq2D / 动图下的算例对比
- 管理员代看他人算例的跨用户对比
- 更改后端系列 `time` 字符串格式

# Design — plot-ux-fixes

## Scope & Boundaries

| 层 | 改动 |
|----|------|
| Frontend `Case.tsx` | 动图显隐/切入 YF 关闭；`seriesMeta` 算例标签；表达式 UI 提示；标题/轴/图例用 `appliedExpression`；`typeOptions` 移除 gfile |
| Frontend `plotExpression.ts` | 可选：附加列别名改为连续 `v1..vn`（跳过 x/y 后重编号），降低映射困惑 |
| Frontend i18n | 占位符与提示文案 |
| Backend `PlotService.cs` | 仅在 R2 需要时加固 `GetPlotAcrossTimes` 对 `prof` 的取文件/容错（与单帧路径对齐） |
| 不改 | API series key 格式、公式后端执行、CSV 导出表头（本轮）；不实现 gfile 绘图 |

## R1 — Hide animation for YF

- 派生：`const animationSupported = nowType !== 'YF' && !isEq2D?` — **1D 且非 YF** 才展示动图；eq2D 已有自己的动图路径，保持现状。
  - 精确条件：展示动图 UI 当 `nowType !== 'YF'`（eq2D 继续可用；YF 隐藏）。
- `animationToggleDisabled` / 整块动图控件：`nowType === 'YF'` 时不渲染。
- `useEffect`：`nowType === 'YF' && animationEnabled` → `setAnimationEnabled(false)`。

## R2 — Profile animation

**假设（实现时用实数据验证）**：

1. `GetPlotAcrossTimes` 无 per-time try/catch，任一时间片 `Contains(type)&&Contains(time)` 取文件失败会抛错 → 整次 preload 失败（`preload-failed`）。
2. 单帧 `GetPlotWithVariables` 吞异常返回空列表，表面「静默空图」；动图路径更易整体失败。
3. `prof` 时间来自文件名 `Split("_")[2]`，与 `Contains(time)` 匹配脆弱（子串碰撞或 token 不一致）。

**设计**：

- 后端：`GetPlotAcrossTimes` 按时间循环时对齐单帧解析策略；单时间失败记日志并跳过（或收集 partial），避免一次失败打垮全部；必要时复用与 `GetTimes` 相同的文件名→time 对应关系选文件，而不是宽松 `Contains`。
- 前端：确认 `prof` 走 1D animation 分支（已是）；preload 失败 toast 保留；若后端返回部分帧，与 eq2D partial 类似可提示。
- 验证：用真实 `prof_*.dat.csv` 样例核对 `GetTimes` token 与 across-times 选文件一致。

## R3 — Case legend labels

- 在 `seriesMeta`（`nowMode === 'case'`）中：从 key 去掉 `${nowY}_` 前缀后得到 `uuid:time`，用 `successCases` / `casesList` 的 `id → caseId(number)` 映射展示为 `#${caseId} @ ${time}`。
- UUID 找不到映射时降级：仍避免裸 UUID 过长时可显示 `#? @ ${time}` 或截断，优先保证不回归成长 UUID（实现选一种并在 check 说明）。
- pivot key **不变**。

## R4 — Expression UX & chart labels

### Prompt / mapping

- 表达式栏：保留「当前 X/Y 物理名」chips；将静态 `f(x,y,v)` 改为可读映射摘要（如 `x=R, y=te, v1=ne`）或 i18n 文案 + 变量下拉已有 `header (alias)`。
- 占位符：`case.expression.placeholder` → `y * 2`（中英同步）。
- **别名编号**：`buildExpressionVariables` 对非 x/y 列按出现顺序连续编号 `v1, v2, …`（修复当前按原 header 下标导致首个附加列可能是 `v3` 的问题）。这仍只认 `x/y/vN`，与决策一致。

### Labels after apply

- `displayYLabel = appliedExpression || nowY`
- 标题：`appliedExpression ? \`${appliedExpression} vs ${nowX}\` : 现有逻辑`
- `seriesMeta`：single/animation 时 `label = displayYLabel`；time/case 对比时系列区分仍用时间/算例后缀，Y 含义侧用公式作轴名即可（轴名优先改；多系列 legend 保持 case/time 区分标签，避免每条都变成同一公式字符串撞车）。
  - **约定**：有公式时 **Y 轴 name** = 原文公式；**图表标题** = `{expression} vs {nowX}`；single 模式图例 = 原文公式；time/case 多系列图例仍用时间或 `#id @ time`（轴名已表达公式）。

### Clear

- 现有 clear 已清 `appliedExpression`；标题/轴随 `displayYLabel` 自动恢复。

## Compatibility

- 不改 OpenAPI / Plot DTO 字段（除非 R2 后端仅行为加固）。
- 旧书签/无公式行为不变。
- `case-plot-comparison.md` 展示约定与本设计一致，实现后可小幅补一句图例格式。

## Rollback

- 前端改动集中在 Case 页 + util + i18n，可按文件回退。
- 后端若改 `GetPlotAcrossTimes`，保持返回形状不变；行为变为更宽容（跳过坏帧）时需确认空结果仍有 toast。

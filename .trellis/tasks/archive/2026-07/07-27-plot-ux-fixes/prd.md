# 绘图体验修复：剖面动图、算例标识、XY运算提示

## Goal

修复算例详情页绘图体验：剖面动图可出图、Y 通量模式去掉动图入口、多算例图例改用数字算例 id、XY 运算提示与图标题/标签反映公式原文；Gfile 不作为绘图类型。

## Background

- 主页面 `Case.tsx`；动图 `usePlotTimeAnimation.ts`；公式 `plotExpression.ts`；后端 `PlotService.cs`。
- `nowType`：`eq1D | eq2D | prof | XF | YF | gfile`。`nowMode`：`single | time | case`。剖面=`prof`，Y 模式=`YF`。
- `YF` 的 `GetTimes` 为 `["不区分"]`；单帧有 YF 特判，跨时间无特判。动图开关目前只看是否有 timeOptions，YF 仍露出无效入口。
- 多算例 API series key 为 `{caseUuid}:{time}`（`.trellis/spec/frontend/case-plot-comparison.md`）；图例目前直接展示 UUID。UI 应使用列表字段 `caseId`（int）。
- 公式只认 `x`/`y`/`vN`；占位符却写 `te * 2`。应用后标题/图例/Y 轴仍用 `nowY`。

## Requirements

### R1 — Y 模式移除动图
- `nowType === 'YF'` 时不展示动图开关与相关控件。
- 切入 YF 时若动图已开，关闭动图并走普通绘图。

### R2 — 剖面动图可绘图
- `nowType === 'prof'` 开启动图时，可预加载并播放多时间片曲线。
- 预加载失败保留明确错误提示；成功时图表有数据。

### R3 — 多算例图例用算例 id
- `nowMode === 'case'`：图例/tooltip 统一为 `#<caseId> @ <time>`（例 `#42 @ 1.234e5`），不出现 UUID。
- 内部 pivot / API key 仍为 `{caseUuid}:{time}`，不改 wire 格式。

### R4 — XY 提示与标题/标签
- 解析只认 `x`/`y`/`vN`。
- 提示明确别名↔物理列映射；占位符改为与能力一致（如 `y * 2`）。
- 应用后：标题 `{expression} vs {nowX}`；Y 轴名与图例/tooltip 系列名为原文 `{expression}`（不做别名→物理名替换）。
- 清除后恢复 `nowY vs nowX`。

### R5 — Gfile 不参与绘图
- 绘图类型选择中移除 `gfile`（数据为 EFIT `.dat`，无 CSV 绘图路径）。
- 保留「下载 G 文件」能力；不实现 GetGFile 画图。

## Acceptance Criteria

- [ ] AC1: `YF` 无动图 UI；带开动图切入 `YF` 后动图关闭且普通图可画。
- [ ] AC2: `prof` 开启动图，多时间片可预加载并播放。
- [ ] AC3: 算例对比图例为 `#<caseId> @ <time>`，无 UUID。
- [ ] AC4: 别名映射提示清晰；占位符与解析一致；应用后标题/Y 轴/图例为原文公式相关文案；清除后恢复。
- [ ] AC5: 绘图类型 Ribbon 无 Gfile；下载 G 文件按钮仍可用。

## Out of Scope

- 不为 `YF` 实现跨时间动图。
- 不为 `gfile` 实现绘图（含 GetGFile 可视化）。
- 不改后端 series key `{uuid}:{time}`；本轮不改 CSV 导出表头。
- 不支持公式直接写物理列名；标题/图例不做别名→物理名替换。
- 后端不解析/执行公式文本。

## Decisions

| 决策 | 选择 |
|------|------|
| 公式标识符 | 只认 `x`/`y`/`vN` |
| 应用后展示 | 用户输入原文；标题 `{expression} vs {nowX}` |
| 多算例图例 | 统一 `#<caseId> @ <time>` |
| Gfile | 不参与绘图；仅保留下载 |

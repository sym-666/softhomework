# 逐步输入参数折线图编辑器

## Goal

在「逐步输入」动态参数页中，为当前 Block 的 `short_array` 参数提供可视化折线图编辑：选 1 个 X + 多个 Y，用折线图展示并双向编辑（拖点 ↔ 参数输入），改动写回 `dynamicForm`。

## Background

- 入口：`DynamicPanelPage.tsx`（「全部参数 / 搜索参数」Tabs 旁）。
- 状态：`useDynamicForm` → Redux `dynamicForm`（`updateField` / `getFieldValue`）。
- 候选类型：`short_array` = `number[]`（`ConfigSchema.ts`）。
- 现有输入：`DynamicField` 短数组逗号分隔。
- 图表：项目已用 `echarts-for-react`（`Case.tsx`、`summary.tsx`）；**必须使用 ECharts，禁止 D3**。
- 弹层：已有 shadcn `Dialog`。

## Decisions

| ID | Decision |
|----|----------|
| D1 | 候选仅 `short_array`；`long_array` 本期不做 |
| D2 | 数据点可拖：水平改 X[i]，垂直改对应 Y 系列的 Y[i] |
| D3 | 大尺寸居中 Dialog（约 90vw / max-w-5xl），左右分栏 |
| D4 | 图表技术栈：**ECharts + echarts-for-react only**；不用 D3 |

## Requirements

### R1. 入口
- 在 Tabs（全部参数 / 搜索参数）同一行旁新增「参数关系图」按钮。
- 点击打开大尺寸 Dialog。

### R2. 参数选择
- 候选 = 当前 `panel.fields` 中 `type === 'short_array'`。
- 选恰好 1 个 X、至少 1 个 Y（多选）；同一字段不可同时作 X 与 Y（Y 列表排除已选 X）。
- X 与每个 Y 长度相同才绘制该系列；不一致则 warning。

### R3. 可视化与双向编辑
- 折线图：X 为横轴数值，每个合法 Y 为一条系列；点可拖。
- Dialog 内同时展示所选 X/Y 的参数输入（复用或对齐 `DynamicField` short_array 交互），与图表联动。
- 输入改数组 → 图表更新；拖点 → `updateField` 写回对应数组同一索引。
- 主页面 `DynamicInput` 与 Dialog 共享 Redux，关闭后值保持。

### R4. 校验
- 长度不一致：warning（参数 id + 双方长度）；该 Y 不绘制 / 不拖点。
- 未选齐 X 或 Y：空状态引导，不报错。
- 当前 Block 无 `short_array`：入口可点但 Dialog 内提示无可选参数。

## Acceptance Criteria

- [ ] AC1: Tabs 旁有入口按钮，可打开 Dialog。
- [ ] AC2: 候选仅当前 Block 的 `short_array`。
- [ ] AC3: 1 个 X + 多个 Y；多 Y 多系列折线。
- [ ] AC4: 参数输入与图表双向同步，写回 `dynamicForm`。
- [ ] AC5: 可拖点修改 X[i] 与 Y[i]。
- [ ] AC6: X/Y 长度不一致时 warning，不静默错误绘图/写回。
- [ ] AC7: 关闭 Dialog 后主表单为最新值。
- [ ] AC8: 实现仅用 ECharts，无 D3 依赖。
- [ ] AC9: Dialog 内支持撤回参数值修改（按钮 + Ctrl/⌘+Z）；可撤回输入与拖点写回。

## Out of Scope

- 跨 Block 选参；bool/number 作轴；`long_array`；后端 API；图表导出；D3。

## Technical Notes (non-design)

- 拖点：ECharts 自定义 graphic / 可拖 symbol + `mousemove`/`mouseup`，或官方 draggable 点方案；拖拽结束写回 Redux，避免拖拽中高频 dispatch 可节流到 pointerup。
- 长度校验在选参与读值时执行；仅对长度匹配的 Y 建 series。

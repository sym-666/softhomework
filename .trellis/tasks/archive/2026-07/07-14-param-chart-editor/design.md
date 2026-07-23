# Design: 参数关系图编辑器

## Architecture

```
DynamicPanelPage
  ├─ Tabs (全部参数 / 搜索参数) + [参数关系图] Button
  └─ ParamChartEditorDialog (open state local)
       ├─ AxisSelector     (X single-select, Y multi-select from short_array)
       ├─ SelectedFieldInputs  (short_array text inputs via updateField)
       └─ ParamRelationChart   (ECharts line + drag → updateField)
```

- 新组件目录：`src/components/add-cases/param-chart/`（或单文件起步，复杂则拆）。
- 状态：Dialog 开闭、X 字段 id、Y 字段 id[] 为组件本地 state；数组值一律读 Redux，不复制一份 source of truth。
- 写回：仅 `useDynamicForm(configName, panel.id).updateField`。

## Data Flow

1. `shortArrayFields = panel.fields.filter(f => f.type === 'short_array')`
2. 读值：`getFieldValue(id) as number[]`（fallback `field.default` / `[]`）
3. 对每个 yId：`x.length === y.length` → series；else → warning 列表
4. series 数据：`points[i] = [x[i], y[i]]`（value 坐标轴，非 category）
5. 拖点结束：clone 数组 → 改 index i 的 x 或 y → `updateField`
6. 输入框 `onChange`：parse 逗号分隔 → `updateField` → chart option 由 Redux 派生重算

## Contracts

### ParamChartEditorDialog props
```ts
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel: Panel;
  configName: string;
}
```

### Length warning shape
```ts
{ yFieldId: string; xLen: number; yLen: number }
```

## UI Layout (Dialog)

- Header: 标题「参数关系图」+ 关闭
- Body grid：
  - 左（约 2/5）：X 选择（Select/Radio）、Y 多选（Checkbox 列表）、warning 区、已选参数 short_array 输入
  - 右（约 3/5）：ECharts 折线图（固定 min-height ~360px）
- 无 short_array：左侧空状态文案

## ECharts Drag Strategy

- 使用 `echarts-for-react` + 现有 echarts 依赖；**禁止引入 D3**。
- 推荐：
  - `xAxis/yAxis: type: 'value'`
  - series: `type: 'line'`, `symbolSize` 加大便于抓取
  - 监听 `mousedown` on series 点 → 记录 seriesIndex + dataIndex
  - `zr.on('mousemove')` 用 `convertFromPixel` 得到新坐标
  - 多 Y 时：拖某系列点只改该 Y[i]；水平位移改共享 X[i]（所有系列共享 X 字段）
  - `mouseup` 时一次性 `updateField`（拖动过程可本地 preview option，避免每帧 Redux）
- 兼容性：仅长度合法的 series 可拖；非法 Y 不入 series。

## Compatibility

- 不改后端、不改 ConfigSchema。
- 不改 `DynamicField` 对外 API；Dialog 内可复用相同 parse/join 逻辑（小工具函数抽出或内联）。
- 无 short_array 的 panel：按钮仍显示，Dialog 内提示即可（或 disabled + tooltip，优先仍可打开说明）。

## Trade-offs

| 选项 | 取舍 |
|------|------|
| Dialog vs Drawer | Dialog 已存在、宽屏分栏更好 → Dialog |
| 拖中 preview 本地 vs 全走 Redux | 本地 preview + mouseup 写回，减少 re-render 卡顿 |
| 复用 DynamicField vs 轻量 Input | 轻量 Input 避免 Dialog 内大卡片网格；逻辑对齐 short_array |

## Rollback

- 删除入口按钮与 `ParamChartEditorDialog` 引用即可；无数据迁移。

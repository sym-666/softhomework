# Implement: 参数关系图编辑器

## Checklist

1. [ ] 新增 `ParamChartEditorDialog`（及内部 chart/selector 子组件，按需）
   - 路径：`cbaldur-frontend-next/src/components/add-cases/ParamChartEditorDialog.tsx`（可再拆）
2. [ ] `DynamicPanelPage.tsx`：TabsList 旁加按钮 + Dialog 状态与挂载
3. [ ] 候选过滤：`short_array` only；X 单选、Y 多选、互斥
4. [ ] 长度校验 + warning UI
5. [ ] 左侧 short_array 输入写回 `updateField`
6. [ ] 右侧 ECharts 折线（多 series）；禁止 D3
7. [ ] 拖点：水平 X[i]、垂直 Y[i]；mouseup 写回
8. [ ] 空状态：无候选 / 未选齐
9. [ ] `npm run lint`（及项目既有 format 如需要）

## Validation

```bash
cd cbaldur-frontend-next && npm run lint
```

手动：
- 打开逐步输入某含 short_array 的 Block → 打开关系图 → 选 X/Y → 改输入看图 → 拖点看输入与主表单
- 故意把某 Y 长度改不同 → 见 warning、该系列消失
- 无 short_array 的 Block → 提示

## Risky files

- `DynamicPanelPage.tsx`（入口）
- 新 Dialog/Chart 组件（拖点逻辑）

## Rollback

- 去掉按钮与 Dialog import；删除新文件。

## Pre-start gate

- [x] prd / design / implement 已写
- [ ] implement.jsonl / check.jsonl 已有真实条目（非 _example）
- [ ] 用户评审通过后再 `task.py start`

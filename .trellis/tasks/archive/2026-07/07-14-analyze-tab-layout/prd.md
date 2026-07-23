# Analyze tab 布局：去掉多余文案并上移 tab

## Goal

Analyze 视图下，去掉全局 Ribbon 中无意义的占位文案，让 Case 页内的 Analyze 工具栏直接顶到顶部 Tab 行下方，消除多余空白。

## Context

- 路径：case 详情页（`/cases/:id/...`）时 `RibbonLayout` 激活 `analyze` tab
- 现状：全局 Ribbon Content 渲染 `AnalyzeRibbonPlaceholder`（文案 “Analyze tools available in the case view below.”），真正工具栏在 `Case.tsx` 内再画一层
- Admin / Forum 已对全局 Ribbon Content 做隐藏；Analyze 应对齐该模式

## Requirements

1. Analyze tab 下不再显示 “Analyze tools available in the case view below.” 占位文案
2. Analyze 时隐藏全局 Ribbon Content 区域（与 admin/forum 一致），使 Case 内工具栏上移贴紧 Tab 行
3. 删除不再使用的 `AnalyzeRibbonPlaceholder` 组件
4. Case 页 Analyze 工具栏（topology / comparison / export / tools）行为与样式保持不变

## Acceptance Criteria

- [x] 进入任意 case 详情（Analyze）时，顶部不再出现占位文案
- [x] Analyze 下全局 Ribbon Content 区域不渲染，工具栏紧贴 Tab 行下方
- [x] `AnalyzeRibbonPlaceholder` 已从代码中移除
- [x] 其他 tab（Home / Cases / Add Cases / Settings 等）Ribbon 行为不受影响
- [x] Case 内 Analyze 各 Ribbon 按钮仍可正常使用

## Out of Scope

- 不重构 Case 内工具栏实现（不迁入全局 Ribbon）
- 不改 i18n / 业务逻辑 / 其他路由布局

## Notes

- 轻量任务，PRD-only
- 主要改动文件：`cbaldur-frontend-next/src/components/office/RibbonLayout.tsx`
- 可能需微调 `Case.tsx` 高度计算（若隐藏全局 ribbon content 后出现多余空白或裁切）

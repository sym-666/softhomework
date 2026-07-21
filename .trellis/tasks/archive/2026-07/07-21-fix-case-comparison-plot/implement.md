# Implement: 修复算例对比绘图

## Checklist

1. [x] `plot.ts`：如缺则导出 `useLazyGetTimesQuery`
2. [x] `Case.tsx`：`setNowCases`；切入 `case` 模式时按 R3 seed；`useGetCasesQuery` 过滤 success 候选
3. [x] `Case.tsx`：侧栏算例对比 UI（勾选算例 + 每算例多选时间 + 全选/清空）
4. [x] `Case.tsx`：确保拉数/CSV 使用「至少含一个非空 times」的有效 `nowCases`；当前算例时间用现有 `timeOptions`
5. [x] i18n：`zh-CN` / `en` 增加算例选择相关文案（列表标题、空态、已选计数等）
6. [x] 验证：`npm run lint`（`cbaldur-frontend-next`）— 变更文件 eslint 通过；仓库全量 lint 仍有既有无关错误

## Validation

```bash
cd cbaldur-frontend-next && npm run lint
```

手动：打开 success 算例详情 → 算例对比 → 确认当前算例与时间已预选 → 勾选另一算例并选时间 → 出多系列图 → CSV 可下。

## Risky files / rollback

- 主改：`src/routes/cases/Case.tsx`（文件大，改动集中在 state + 侧栏 `nowMode === 'case'` 分支）
- 回滚：还原 Case.tsx / i18n / plot hook 导出

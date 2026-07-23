# Design: 算例对比侧栏与状态接线

## Boundary

- **In scope**: `Case.tsx` 算例对比 UI 与 `setNowCases` 状态；`useGetCasesQuery` 过滤候选；按需 `GetTimes`；i18n 文案；既有 plot/CSV mutation 接线校验。
- **Out of scope**: Plot 后端、跨用户、eq2D/动图对比、改 `{caseId}:{time}` 标记。

## State

```ts
const [nowCases, setNowCases] = useState<{ caseId: number; times: string[] }[]>([]);
```

- 勾选算例：upsert `{ caseId, times: [] }`（切入模式时当前算例 times 预填 `[nowTime]` 若有）。
- 取消勾选：从 `nowCases` 移除该项。
- 改某算例时间：更新对应项的 `times`。
- 请求过滤：仅把 `times.length > 0` 的项传给 `getPlotAcrossCases` / CSV（或整表依赖现有 `nowCases.length > 0` 且内层非空——实现时统一为「有效项」列表，避免空 times 触发无效文件查找）。

## Data flow

```
切换 nowMode → 'case'
  → 若 nowCases 为空则 seed: [{ caseId, times: nowTime ? [nowTime] : [] }]
useGetCasesQuery → filter status==='success'（含当前 id）
勾选算例 → lazy/按需 GetTimes(caseId, nowType)
用户多选 times → setNowCases
effect(现有) → getPlotAcrossCases({ type, cases: effectiveNowCases, x, y, variables? })
```

## UI

- 侧栏在 `nowMode === 'case'` 增加区块（对齐时间对比布局）：
  - 算例列表：checkbox + `#id` + comment（过长截断）
  - 展开/内嵌：该算例时间 checkbox 列表 + 全选/清空
- 无成功算例时显示简短空态文案（i18n）。

## Times loading

- Prefer `useLazyGetTimesQuery`（若未导出则先在 `plot.ts` 导出）按勾选算例拉取；缓存同一 `caseId+type`。
- 当前算例可复用页面已有 `timeOptions`（`useGetTimesQuery`），避免重复请求。

## Compatibility

- 不改 API 契约；仅补齐前端缺失 UI/状态。
- 表达式辅助变量路径已在 case 分支传 `variables`，保持。

## Rollback

- 还原 `Case.tsx` / i18n / 可能的 `useLazyGetTimesQuery` 导出即可。

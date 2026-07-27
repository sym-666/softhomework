# Implement — plot-ux-fixes

## Checklist

1. **R1 YF 隐藏动图**（`Case.tsx`）
   - [ ] `nowType === 'YF'` 时不渲染动图开关/播放条。
   - [ ] `useEffect`：切入 YF 强制 `setAnimationEnabled(false)`。
2. **R2 剖面动图**（先复现再改）
   - [ ] 用真实/沙箱 `prof` CSV 核对 `GetTimes` token 与 `GetPlotAcrossTimes` 选文件。
   - [ ] 加固 `PlotService.GetPlotAcrossTimes`（per-time 容错或精确选文件）。
   - [ ] 确认前端 `prof` 1D preload → 图表有帧可播。
3. **R3 算例图例**（`Case.tsx` `seriesMeta`）
   - [ ] UUID→数字 `caseId` 映射；标签 `#${caseId} @ ${time}`。
4. **R4 公式 UX**
   - [ ] `buildExpressionVariables` 连续 `v1..vn`。
   - [ ] 表达式栏映射提示；i18n 占位符改 `y * 2`（zh/en）。
   - [ ] 标题 `{expression} vs {nowX}`；Y 轴 = 原文公式；single 图例 = 公式；time/case 图例仍为时间/`#id @ time`。
5. **R5 Gfile 不参与绘图**
   - [x] 从 `typeOptions` 移除 `gfile`；保留下载按钮。
6. **收尾**
   - [ ] 需要时更新 `.trellis/spec/frontend/case-plot-comparison.md` 图例展示一句。
   - [ ] `npm run lint`（frontend）；`dotnet build`（若改后端）。

## Validation

```bash
cd cbaldur-frontend-next && npm run lint
cd cbaldur-backend && dotnet build
```

手动：

- YF：无动图；从 eq1D 开动图再切 YF → 动图关、图可画。
- prof：动图预加载成功并可播放。
- 算例对比：图例为 `#n @ time`，无 UUID。
- 公式：映射可见；应用 `y * 2` 后标题/Y 轴为公式；清除恢复。

## Risk / Rollback

- 高风险：`GetPlotAcrossTimes` 选文件逻辑 — 改前先对齐 filename 约定；保持响应 schema。
- `vN` 重编号：已保存的用户记忆中的「旧 v3」会变 `v1` — 可接受（此前编号本就不直观）。
- 回滚：还原上述文件即可。

## Ready for start

- [x] `prd.md` 收敛
- [x] `design.md` / `implement.md`
- [ ] 用户审阅通过后 `task.py start`

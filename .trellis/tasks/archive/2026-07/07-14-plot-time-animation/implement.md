# Implement: 结果绘图时间演进动图

## Checklist

1. **状态与开关**
   - [ ] `Case.tsx`：`animationEnabled` / `isPlaying` / `frameIndex` / frames cache / domain / loading
   - [ ] 时间片区顶部 UI：动图开关；开启时隐藏 single/time 时间控件，展示播放控件
   - [ ] Ribbon：动图开启时禁用 `time`/`case` mode 按钮

2. **1D 预加载与渲染**
   - [ ] 开启动图且 x/y/type/timeOptions 就绪 → `GetPlotAcrossTimes` 全量预加载
   - [ ] 按 time 建帧；算全局 domain；应用 `appliedExpression`（若有）
   - [ ] `echartsOption` 动图分支：单 series + 固定 axis + 当前帧数据
   - [ ] 换帧不触发单时刻 `GetPlot`（验证 skip 条件）

3. **eq2D 预加载与渲染**
   - [ ] 按 time 限流预取 R–Z 与 psi；复用 contour 构建
   - [ ] 全局 R/Z（及 psi visualMap）domain；换帧只换 contours
   - [ ] loading / 进度提示

4. **播放控制**
   - [ ] play/pause + interval 按 FPS 推进；循环
   - [ ] range 滑条定位；拖动暂停
   - [ ] 标题区 `t =` 同步
   - [ ] 0/1 时间点边界

5. **i18n**
   - [ ] `zh-CN.ts` / `en.ts`：动图开关、播放/暂停、加载中、禁用对比提示等

6. **回归**
   - [ ] 关闭动图后 single/time/case 与导出仍正常
   - [ ] `npm run lint`（frontend）

## Validation

```bash
cd cbaldur-frontend-next && npm run lint
# 手工：开行动图 → 等预加载 → 播放/暂停/拖滑条 → 1D 与 eq2D
# 手工：关闭动图 → single/time 恢复
# 网络面板：播放期间 1D 无额外 GetPlot
```

## Risky files

- `cbaldur-frontend-next/src/routes/cases/Case.tsx`（主逻辑，易回归）
- `cbaldur-frontend-next/src/i18n/messages/zh-CN.ts` / `en.ts`
- 可选：`src/hooks/usePlotTimeAnimation.ts`（若抽取）

## Rollback points

- 完成 UI 开关但未接数据前可只隐藏开关
- 1D 完成 / eq2D 未完成时可先对 eq2D 显示「加载中/暂不支持」——**按 PRD 本期需支持 eq2D**，勿长期留下半成品

## Review gate before `task.py start`

- [x] prd.md 决策收敛
- [x] design.md 数据流与边界
- [x] implement.md 清单
- [ ] 用户审阅通过

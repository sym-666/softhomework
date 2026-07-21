# Design: 结果绘图时间演进动图

## Architecture

在 `Case.tsx` 增加独立状态 `animationEnabled`（名称可调整），与 `nowMode` 正交：

```
[animationEnabled=false]  → 现网路径（single/time/case + 现有时间控件）
[animationEnabled=true]   → 动图路径（预加载缓存 + 帧索引驱动 ECharts）
```

不新增 Ribbon mode；动图入口仅在侧栏「时间片」区顶部。

## UI Boundaries

| 区域 | 行为 |
|------|------|
| 时间片区顶部 | Switch/Checkbox「动图」 |
| 动图开启 | 隐藏 single Select / time 多选；显示 播放/暂停、range 滑条、当前 t |
| Ribbon 对比 | 动图开启时禁用 time/case 按钮，或点击时 toast 并保持动图；推荐：**禁用** time/case |
| 图表标题 | `t = {currentFrameTime}` 与滑条同步 |
| 导出 | 导出当前帧（复用现有图片/CSV 能力；CSV 对当前帧或提示仅当前帧） |

滑条：无 shadcn Slider → 使用原生 `input[type=range]`（min=0, max=n-1, step=1），样式贴近侧栏。

## State

```ts
animationEnabled: boolean
isPlaying: boolean
frameIndex: number              // 0..timeOptions.length-1
animationFrames: Map|Record    // time → 1D points 或 eq2D contour cache
animationDomain: { x, y } | eq2D domains
isAnimationLoading: boolean
animationLoadProgress?: number // eq2D 多请求时可选
```

- 开启动图 → 暂停播放、frameIndex=0（或保留上次）、触发预加载
- 关闭动图 → 停 timer、清播放态；可选保留 cache 直至 type/x/y/case 变化
- type / x / y / caseId / timeOptions 变化 → 失效 cache 并重新预加载（若仍开启）

## Data Flow

### 1D

1. `getPlotAcrossTimes({ caseId, type, times: timeOptions, x, y })`
2. 按 `time` 字段分组为 `frames[time] = [{x,y}, ...]`（注意 API 返回结构与现有 `renameKeys` 一致）
3. 全局 domain：遍历全部帧的 x/y 算 min/max + padding（复用现有 padding 逻辑）
4. 当前帧：`frames[timeOptions[frameIndex]]` → 单 series line option，axis 用全局 domain
5. 播放：`setInterval` / `requestAnimationFrame` 节流，每 `1000/FPS` ms：`frameIndex = (i+1) % n`

### eq2D

1. 对每个 `time` 请求 `GetPlot(R,Z)` + `GetPlot(R,psi)`（可并发限流，如 3–5）
2. 复用现有 `eq2DContours` 构建逻辑生成每帧 contours
3. 全局 R/Z domain（及 visualMap psi 范围可选：全局或当前帧；推荐 **psi 也用全局** 保持色标稳定）
4. 播放同 1D，换帧只换 series data

### 与现有 fetch 隔离

- `animationEnabled` 时：`useGetPlotQuery` skip 或忽略其写入 `plotData`；`fetchData` early-return
- 动图 option 可独立 `animationEchartsOption` useMemo，或扩展现有 `echartsOption` 分支，避免污染 multi-series pivot

## ECharts Refresh

- 优先：React state 更新 `option` → ReactECharts 重渲染（`notMerge` 默认行为需确认；换帧时建议 `notMerge={false}` 且只改 series data + 固定 axis，减少闪烁）
- 备选：`echartsRef.current.setOption(partial, { notMerge: false, lazyUpdate: true })`
- 关闭 ECharts 自带 `animation` 或缩短 duration，避免帧间过渡拖沓（`animationDuration: 0` 或 200ms）

## Playback

| 常量 | 建议值 |
|------|--------|
| FPS | 4（250ms/帧） |
| 循环 | true |

- 播放中拖滑条：更新 `frameIndex` 并 **暂停**
- 仅 1 个时间点：显示该帧，播放按钮 disabled
- 0 个时间点：动图开关 disabled 或开启后 empty state

## Compatibility

- 现有 single/time/case 代码路径：`animationEnabled===false` 时零行为变化
- eq2D 已强制 single：动图不依赖 nowMode
- expression（nerdamer）：1D 预加载后对每帧 y 应用 `appliedExpression`（与现网一致）

## Risks & Mitigations

| 风险 | 缓解 |
|------|------|
| eq2D 时刻多导致预加载慢/压力大 | 并发限制 + 进度条；失败时刻跳过并 toast |
| AcrossTimes 返回结构与预期不符 | 实现前对照后端/现有 pivot 逻辑解析 `time` 字段 |
| Case.tsx 过大 | 播放逻辑抽 `usePlotTimeAnimation` hook（可选，优先可读性） |
| 内存 | 切换 type 时释放 frames |

## Rollback

关闭动图入口或 feature flag（若未加 flag：revert Case.tsx + i18n 即可）。无后端迁移。

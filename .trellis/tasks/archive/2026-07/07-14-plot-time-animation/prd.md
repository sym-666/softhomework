# 结果绘图时间演进动图

## Goal

在 Case 结果绘图页增加时间演进动图：用户在「时间片」配置区顶部独立开启动图后，系统预加载全时段数据，用 ECharts 按时间顺序动态刷新当前帧，直观观察物理量随时间演化。

## Background

- 页面：`cbaldur-frontend-next/src/routes/cases/Case.tsx`
- 图表：`echarts-for-react`，option 由 `echartsOption` 生成
- 时间列表：`useGetTimesQuery` → `timeOptions`
- 单时刻：`useGetPlotQuery`（`nowMode === 'single'`）
- 多时刻叠加：`useGetPlotAcrossTimesMutation`（`nowMode === 'time'`）
- eq2D：等高线（R–Z–psi），强制 single；无跨时刻等高线批量 API
- 时间片 UI：侧栏 `case.config.timeSlices`（single=Select，time=多选）
- i18n：`zh-CN.ts` / `en.ts` 中 `case.*` 键

## Decisions

| ID | 决策 |
|----|------|
| D1 | 覆盖 1D 曲线（eq1D/prof/XF/YF/gfile 等）与 eq2D 等高线 |
| D2 | 时间选择栏**最上方**独立「动图」入口；不复用 single Select / time Checkbox |
| D3 | 数据：先批量预加载，再本地逐帧刷新；1D 用 `GetPlotAcrossTimes`；eq2D 客户端按时刻预取 `GetPlot`（R/Z + psi）并缓存 |
| D4 | 控件 MVP：播放/暂停 + 时间滑条 + 当前时刻；默认循环；固定帧率常量（2–5 fps）；无速度档位/逐帧按钮 |
| D5 | 坐标轴：预加载后算全时段全局 min/max，播放全程固定 |
| D6 | 动图为侧栏时间区独立开关；开启后**覆盖** single/time 时间控件，只显示播放控件；数据按本 case 全量 `timeOptions`、每帧单曲线/单等高线；Ribbon `time`/`case` 对比在动图开启时禁用或忽略 |

## Requirements

- R1：`case.config.timeSlices` 区块标题下、现有时间控件之上，提供独立「动图」开关/入口
- R2：动图开启后隐藏 single Select 与 time 多选，展示播放/暂停、滑条、当前时刻
- R3：1D：进入动图且 x/y/type 就绪后，对全量 `timeOptions` 调用 `GetPlotAcrossTimes` 预加载；播放仅本地换帧
- R4：eq2D：预加载各时刻 R–Z 与 psi 数据并缓存；播放本地换帧
- R5：播放按 `timeOptions` 顺序推进；默认循环；固定默认帧率
- R6：滑条可拖动定位帧；拖动时暂停或定位后保持暂停态（实现选一种一致行为）
- R7：当前时刻文案与图表标题区 `t = …` 同步
- R8：播放全程使用全局坐标 domain
- R9：关闭动图后恢复原先 mode 下的时间控件与现网数据路径
- R10：无时间点 / 仅 1 点 / 预加载中：禁用播放或给出明确状态，不崩溃
- R11：中英文 i18n 键齐全
- R12：不破坏现有 single/time/case 主路径及 CSV/图片导出（动图下导出当前帧即可，不要求导出 GIF）

## Acceptance Criteria

- [ ] AC1：时间片区顶部有独立动图入口，与 single/time 时间选择分离
- [ ] AC2：开启动图后可播放；1D 与 eq2D 图表均按时间顺序变化
- [ ] AC3：可暂停；暂停后停在当前帧；默认循环
- [ ] AC4：滑条可定位任意帧；当前时刻始终可见
- [ ] AC5：关闭动图后 single/time 行为与现网一致
- [ ] AC6：无时间 / 单时间 / 加载中表现合理
- [ ] AC7：1D 预加载完成后，换帧不重复请求 plot 接口（type/x/y 未变时）
- [ ] AC8：播放全程坐标轴范围稳定（全局 domain）
- [ ] AC9：动图开启时 time/case 对比不生效（禁用或忽略）
- [ ] AC10：中英文文案齐全

## Out of Scope

- 导出 GIF/视频
- 后端新增动画 API
- 跨 case 动画
- time 模式多 series 轮播
- 速度档位、上一帧/下一帧
- 坐标轴锁定开关（本期默认全局固定）

## Technical Notes

- 主要改动面：`Case.tsx`；可能抽轻量 hook/控件；`plot.ts` 优先复用现有 endpoint
- eq2D 预加载可能较慢：需进度或 loading 状态
- 无 shadcn Slider 时可用 `input[type=range]` 或补充 shadcn slider

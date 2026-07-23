# Cases page realtime refresh via SSE

## Goal

用户停留在 `/cases` 或首页 dashboard 时，案例流水线结束后的 `Status`（`running` → `success` / `failed`）无需手动刷新即可可见。

## Background

- `/cases` 与首页均通过 RTK Query `useGetCasesQuery` → `GET /api/Case/GetCases` 拉列表；无轮询。
- 新建后仅靠 `createCase` / `createCaseByNamelist` 的 `invalidatesTags: ['Case']` 刷新；后台 `ExecuteCalculationTask*` 写库改状态后无推送。
- 鉴权为 HttpOnly cookie `AuthToken`；前端 API `credentials: 'include'`。
- 仓库无现成 WebSocket / SignalR / SSE。

## Decisions

| 决策 | 选择 |
|------|------|
| 推送触发 | 仅状态变更（`success` / `failed`） |
| 覆盖页面 | `/cases` + 首页 dashboard |
| 传输 | SSE |
| 前端更新 | `invalidateTags(['Case'])` 整表重拉 |

## Requirements

- R1: 用户可见案例状态变为 `success`/`failed` 后，已打开的 `/cases` 与首页在合理延迟内反映新状态。
- R2: `/cases` 与首页共用同一套 SSE 订阅逻辑（单连接优先）。
- R3: SSE 需登录；未授权不得订阅，且只向案例所属用户推送。
- R4: 断线后自动重连；重连后后续状态变更仍能刷新列表。
- R5: 新建列表刷新继续依赖现有 RTK invalidation，不依赖 SSE。

## Acceptance Criteria

- [ ] AC1: `/cases` 停留时跑完案例，状态从 `running` 变为 `success`/`failed`，无需手动刷新。（R1）
- [ ] AC2: 首页 dashboard 停留时同样可见状态变更。（R1, R2）
- [ ] AC3: 仅状态变更触发推送；新建不依赖 SSE。（R5）
- [ ] AC4: 未带有效 `AuthToken` 无法订阅 SSE。（R3）
- [ ] AC5: 断线重连后，后续状态变更仍更新列表。（R4）
- [ ] AC6: 实现为 SSE，非 WebSocket/SignalR。（决策）

## Out of Scope

- 管理端 `/admin` 案例列表
- 案例详情 plot/日志流
- WebSocket / SignalR
- 跨实例 pub-sub（MVP 单进程内存 broker）
- 新建/更新/分享等非状态事件推送
- 按 caseId 局部 patch 缓存

## Technical Notes

- 事件仅作 invalidation 信号；权威数据仍来自 `GetCases` / `CaseListItemModel`（见 case-list-payload-contract）。
- SSE 与现有 `/api` 代理同域，浏览器可自动带 cookie。

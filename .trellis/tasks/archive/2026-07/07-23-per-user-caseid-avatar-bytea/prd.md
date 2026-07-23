# 用户级 caseID 与头像 BYTEA 存储

## Goal

每个用户的算例展示序号从 1 起独立递增并用于排序；算例主键/目录/API 全面 UUID。用户头像改为 PG `BYTEA`，经独立端点读取；GitHub 头像下载入库。

## Background

- 分支 `feature/pgsql`；FreeSql AutoSync；无 migration 脚本
- 子任务：`07-23-per-user-caseid`、`07-23-avatar-bytea-storage`
- 旧 cases 数据与整型目录可废弃；头像旧 text/Base64 亦可随列类型切换清空

## Decisions

| ID | Decision |
|----|----------|
| D1 | Case 主键 UUID；每用户自增 `caseId` 仅展示/排序；`(UserId, caseId)` 唯一；删除不复用 |
| D2 | 目录 `{UserDir}/{userId}/{uuid}`；pipeline `{caseId}` 占位符填 UUID |
| D3 | 对外 API/路由/分享/SSE 导航键全面 UUID；响应另带 `caseId` 整数 |
| D4 | Avatar：DB 存 BYTEA + MIME；`GET /api/User/Avatar`；JSON `avatar` 为该 URL（有图时）；GitHub 登录下载写入 BYTEA |

## Child Task Map

| Child | Owns |
|-------|------|
| `07-23-per-user-caseid` | Case 模型、服务、控制器、前端路由/类型、相关 OpenAPI/spec 契约 |
| `07-23-avatar-bytea-storage` | User 模型、上传/读取端点、Auth GitHub、前端 img src |

## Cross-Child Acceptance Criteria

- [ ] 两子任务验收通过
- [ ] 登录后能看头像、创建算例、按 UUID 进详情、列表显示用户内 caseId 序号
- [ ] 父任务仅集成复核

## Out of Scope

- 旧数据迁移脚本
- 对象存储 / CDN
- ULID / 雪花

## Open Questions

- 无（产品决策已收敛；字段命名见各子任务 design）

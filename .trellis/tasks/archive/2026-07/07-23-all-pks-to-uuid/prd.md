# 全表主键改为 UUID

## Goal

将 `users` / `organizations` / `notices` 的主键及所有相关外键改为 UUID；JWT、磁盘 `{userId}`、前后端类型一并对齐。`RoleId` 与每用户 `CaseId` 保持 int。

## Background

- `cases.Id` 已是 UUID；`Case.UserId` 仍为 int
- JWT `NameIdentifier` / `OrganizationId` claim 现为 int 字符串
- AutoSync 无法安全改 PK 类型 → 开发库可清空重建

## Decisions

| ID | Decision |
|----|----------|
| D1 | `RoleId` 保持 int |
| D2 | 允许 DROP/清空 `auth.users`、`auth.organizations`、`cbaldur.notices`、`cbaldur.cases`（FK 类型变化）及旧整型 UserDir |
| D3 | PK/FK 一律 `Guid`；应用侧 `Guid.NewGuid()` |
| D4 | `CaseId` 用户序号保持 int |

## Requirements

- R1–R8：User/Org/Notice PK → UUID；FK → UUID；JWT Guid；前端 string；`{userId}` UUID；OpenAPI/spec；cases 仅改 UserId；RoleId int

## Acceptance Criteria

- [ ] 三表主键为 uuid，无 identity
- [ ] JWT 解析出 Guid user/org；鉴权可用
- [ ] 算例路径 `{uuidUser}/{uuidCase}` 可用
- [ ] 组织/通知 CRUD 用 UUID
- [ ] 前端不再用 number 表示这些 Id
- [ ] RoleId 仍为 int

## Out of Scope

- CaseId 语义；Role 实体；生产无损迁移

## Open Questions

- 无

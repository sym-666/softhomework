# 用户级 caseID 从1起独立编号

## Goal

每用户算例序号 `caseId` 从 1 自增并用于列表排序/展示；主键与对外导航全面 UUID；目录以 UUID 命名；旧 cases 数据可废弃。

## Background

- 现状：`CaseModel.Id` 全局 int identity；路径/API/SSE/分享均用该 int
- 列表契约 `id: number` 用于导航（需改为 UUID，并增加 `caseId`）

## Decisions

- 主键 `Id: Guid`；`CaseId: int` 每用户自增；唯一约束 `(UserId, CaseId)`
- 目录与 pipeline 远程路径使用 UUID
- 对外全面 UUID；响应含 `id`（uuid）与 `caseId`（int）
- 旧数据废弃；删除后 caseId 不复用

## Requirements

- R1–R6：见原决策（新建分配、唯一、排序降序、路径 UUID、API UUID、无迁移）

## Acceptance Criteria

- [ ] 新用户算例 caseId 为 1, 2, 3…
- [ ] 两用户可同有 caseId=1
- [ ] 列表按 caseId 降序；UI 可显示序号
- [ ] 详情/文件/绘图/分享/SSE 以 UUID 工作；磁盘为 `{userId}/{uuid}`
- [ ] 前端与 list 契约：`id` 为 UUID 字符串，含 `caseId: number`

## Out of Scope

- 头像 BYTEA；旧数据迁移

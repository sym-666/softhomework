# 头像改为 BYTEA 二进制存储

## Goal

头像以 PostgreSQL `BYTEA` 存储；经 `GET /api/User/Avatar` 读取；GitHub 头像下载后入库。

## Background

- 现状：`Avatar` 为 `text`（data URI 或 GitHub URL）；前端 `src={user.avatar}`
- 头像 UI 目前仅展示当前用户

## Decisions

- DB：`byte[]? Avatar` + `string? AvatarContentType`（BYTEA + MIME）
- `GET /api/User/Avatar`（当前登录用户，Cookie JWT）；返回文件字节与 Content-Type
- 用户 JSON 的 `avatar`：有图时为可用 URL（如 `/api/User/Avatar`），无图为 null；**绝不**把 BYTEA/Base64 塞进 JSON
- GitHub 登录：HTTP 下载 `avatar_url` 写入 BYTEA + MIME（仅当本地尚无头像时，保持现有「不覆盖已有头像」行为）
- 旧 text 头像数据可随列切换废弃/清空

## Requirements

- R1: 上传写入 BYTEA，不存 Base64 文本
- R2: 类型与 2MB 校验保持
- R3: 侧栏/顶栏/用户页能显示
- R4: GitHub 与本地上传同一存储路径

## Acceptance Criteria

- [ ] 上传后 DB 为 BYTEA
- [ ] `GET /api/User/Avatar` 返回正确图片
- [ ] 用户 JSON 无巨型 Base64；`avatar` 为 URL 或 null
- [ ] GitHub 新用户/无头像用户登录后能显示头像
- [ ] 未上传时占位不回退

## Out of Scope

- caseID；对象存储；他人头像公开 CDN

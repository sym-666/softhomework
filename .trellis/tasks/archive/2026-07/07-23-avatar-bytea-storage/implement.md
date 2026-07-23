# Implement: avatar BYTEA

## Order

1. `UserModel`：`Avatar` → `bytea`；新增 `AvatarContentType`
2. DB 准备：若 text→bytea 失败，先 NULL/drop Avatar 列后重启 AutoSync
3. `UploadAvatarAsync` 写 bytes + mime；去掉 Base64
4. 新增 `GetAvatarAsync` + `UserController.GetAvatar`
5. 所有返回 User 的 API：映射 `avatar` URL，禁止序列化 byte[]
6. `AuthService` GitHub：下载头像入库（保留「已有头像不覆盖」）
7. Frontend：确认 img 使用 URL；上传成功后 refresh user；必要时 cache bust
8. OpenAPI / 类型对齐

## Validation

```bash
cd cbaldur-backend && dotnet build
```

Manual: 上传 png → DB bytea；`GET /api/User/Avatar` 出图；侧栏显示；GitHub 登录无头像用户拉取成功。

## Risk / rollback

- JSON 误序列化 byte[] → 巨型/损坏响应；用 DTO 或 `[JsonIgnore]` 打在 byte[] 上
- `<img>` 跨站 cookie：保持同域 `/api`

## Notes

- 可与 caseId 子任务并行

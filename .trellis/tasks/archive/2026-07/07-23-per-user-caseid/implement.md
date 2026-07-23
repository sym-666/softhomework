# Implement: per-user caseId + UUID

## Order

1. Wipe/prepare DB: clear `cbaldur.cases` if needed for PK type change; remove old int workdirs under UserDir (dev)
2. Update `CaseModel`：`Guid Id` PK；`int CaseId`；unique index `(UserId, CaseId)`
3. Update `CaseListItemModel` + all CaseService create/list/get/file/share paths to Guid workdirs
4. Allocate CaseId in transaction on create；return Guid Id
5. Controllers：所有 int case 键改 Guid；SSE/Share/Plot 对齐
6. `PipelineExecutor` / yaml：`{caseId}` → Guid string
7. Frontend：路由、RTK、Case 页、admin 链接、比较逻辑
8. Specs：`case-list-payload-contract.md`、`case-status-sse-contract.md`（+ 如有 OpenAPI）
9. `dotnet build`；手动：创建两用户各一算例 → caseId 均为 1；目录为 uuid；详情 UUID 可开

## Validation

```bash
cd cbaldur-backend && dotnet build
cd cbaldur-frontend-next && npm run lint
```

Manual: create cases, open `/cases/{userId}/{uuid}`, plot/files, share link, SSE status update.

## Risk / rollback

- AutoSync PK change失败 → drop table `cbaldur.cases` 后重启（数据已声明可废弃）
- 前端遗漏 int→uuid → 404；用 grep `caseId: number` / `GetCaseQuery(` 扫尾

## Notes

- Parent 集成在两子任务都完成后再做
- 与 avatar 子任务无硬依赖，可并行；建议本任务先合，因面更大

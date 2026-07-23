# Implement: GetCases 列表载荷

## Checklist

1. [x] 新增 `Models/CaseListItemModel.cs`
2. [x] `ICaseService` + `CaseService`：`GetCaseListItemsByUserIdAsync`、`GetCaseListItemsByOrganizationIdAsync`
3. [x] `CaseController`：`GetCases`、`GetCasesForAdmin` 改用列表方法
4. [x] 前端：`CaseListItem` 类型、`getCases` / `getAdminCases` 泛型、`useLazyGetCaseQuery`
5. [x] `routes/cases/index.tsx`：`hasCaseJsonPrototype` + 点击时 lazy `GetCase`
6. [x] 验证：`dotnet build`、`npm run lint`

## Validation

```bash
cd cbaldur-backend && dotnet build
cd cbaldur-frontend-next && npm run lint
```

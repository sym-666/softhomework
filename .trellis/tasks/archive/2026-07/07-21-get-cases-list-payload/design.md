# Design: GetCases 列表 DTO

## Boundary

- **In scope**: `CaseListItemModel`, `ICaseService` / `CaseService` 列表查询投影，`CaseController.GetCases` / `GetCasesForAdmin`，前端 `caseApi` 与 `routes/cases/index.tsx`、`routes/index.tsx`。
- **Out of scope**: `GetCase` 单条详情、分页服务端实现、Memcached 缓存层。

## DTO: `CaseListItemModel`

| Field | Purpose |
|-------|---------|
| `Id`, `UserId` | 导航与详情链接 |
| `Status`, `Comment`, `Tags` | 列表 / 仪表盘展示 |
| `JsonOrNamelist` | 模板新建分支 |
| `HasCaseJsonPrototype` | 禁用 JSON 模板按钮（替代传输完整 prototype） |
| `CreatedAt`, `UpdatedAt` | 时间展示与运行时长 |

## Data flow

```
GetCases → CaseService.GetCaseListItemsByUserIdAsync → SQL 仅选 cases 表列（无 User join）
Cases page / Dashboard → useGetCasesQuery → 轻量 JSON
「以此为模板新建」(JSON) → useLazyGetCaseQuery(id) → caseJsonPrototype
```

## Compatibility

- 破坏性变更仅针对列表端点响应形状；详情与其它 Case API 不变。
- JSON 属性名保持 ASP.NET Core 默认 camelCase，与现有前端一致。

## Rollback

- 恢复 Controller/Service 返回 `CaseModel` 并回滚前端类型与 lazy 拉取即可。

# 优化 GetCases 列表载荷

## Goal

缩短算例列表首屏时间：减少 `GET /api/Case/GetCases`（及管理员列表）响应体积与反序列化成本，同时保持列表页与仪表盘现有功能。

## Requirements

- 列表接口不得返回完整算例正文：`caseJson`、`caseNamelist`、嵌套 `user`（含密码哈希、头像等）。
- 列表接口应返回列表与仪表盘实际使用的字段；「以此为模板新建」在 JSON 模板路径下通过按需拉取单条算例获取 `caseJsonPrototype`。
- `GetCasesForAdmin` 与 `GetCases` 使用同一列表 DTO，避免管理员视图继续拉全量。
- 前端 RTK Query 类型与列表/仪表盘组件对齐新契约。

## Acceptance Criteria

- [x] `GetCases` / `GetCasesForAdmin` 返回 `CaseListItemModel`（或等价 DTO），不含 `caseJson`、`caseNamelist`、`user` 及完整 `caseJsonPrototype`。
- [x] 算例列表页：表格、分页、「查看详情」、「以此为模板新建」（namelist 与 json 两条路径）行为与优化前一致。
- [x] 仪表盘：统计、图表、最近算例表仍仅依赖列表字段即可工作。
- [x] `dotnet build` 与前端 `npm run lint`（或 typecheck）通过。

## Notes

- 列表项用 `hasCaseJsonPrototype` 控制「以此为模板新建」禁用态，避免为每一行传输 prototype JSON。

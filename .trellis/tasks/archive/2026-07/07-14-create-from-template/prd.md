# 完成「以此为模板新建」

## Goal

在算例列表中点击「以此为模板新建」后，用已有算例的输入数据预填创建流程，让用户可修改后提交为新算例。

## Background

- 入口：`cbaldur-frontend-next/src/routes/cases/index.tsx`；`handleNewWith` 仍为 TODO（仅 `console.log`）。
- 点击参数：`jsonOrNamelist === true` 时传 `caseId`；`false` 时传 `caseJsonPrototype` 字符串。
- 按钮在 `caseJsonPrototype === null` 时禁用。
- Namelist：`/add-cases/namelist?caseId=` 已支持 `useGetCaseQuery` → 预填 `caseNamelist`。
- 动态创建提交：`CaseJsonPrototype = JSON.stringify(dynamicForm[configName])`；shape 为 `{ [panelId]: { [fieldId]: value } }`。
- 当前 schema 仅 `baldur`；case 未存 `configName`。
- `initializePanel` 只在字段 `undefined` 时写默认值，先灌 prototype 再进 panel 不会被覆盖。

## Decisions

- D1：非 Namelist → 逐步输入 dynamic（非 JSON 页）。
- D2：默认 config = `baldur`。
- D3：prototype 经 Redux 注入，不进 URL。
- D4：写入前先 `resetConfig({ configName: 'baldur' })`，再写入完整 prototype。
- D5：不预填源 Comment；新算例 comment 由用户在提交页填写。

## Requirements

- R1：Namelist 算例 → `/add-cases/namelist?caseId=<id>`，预填 namelist（复用现有页逻辑）。
- R2：非 Namelist 算例 → 解析 `CaseJsonPrototype` → 写入 `dynamicForm.baldur` → 导航 `/add-cases/dynamic/baldur/0`。
- R3：用户可修改后提交为**新**算例，不覆盖源算例。
- R4：无模板数据时按钮 disabled；JSON 非法 toast，不导航。
- R5：URL 不含 prototype 正文。
- R6：仅用户 `/cases` 列表，不改 admin。

## Out of Scope

- 后端克隆 API、`CaseModel` 改字段、多 config 识别。
- Admin 列表、JSON 页预填、静态 `inputSlice` 预填、Comment 预填。

## Acceptance Criteria

- [ ] AC1：Namelist 算例 → namelist 页，内容 = 源 `caseNamelist`。
- [ ] AC2：非 Namelist → `/add-cases/dynamic/baldur/0`，字段 = 源 `CaseJsonPrototype`。
- [ ] AC3：修改并提交后列表出现新 case，源 case 不变。
- [ ] AC4：`handleNewWith` 完成导航/预填，无 TODO 占位。
- [ ] AC5：`caseJsonPrototype === null` 时 disabled；非法 JSON toast 且不跳转。
- [ ] AC6：非 Namelist 路径 URL 无 prototype 正文。
- [ ] AC7：提交页 Comment 为空（未预填源 comment）。

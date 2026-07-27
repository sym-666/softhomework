# 修复JSON新建算例上传/导出按钮并提供默认配置

## Goal

修复「从 JSON 输入」页上传/下载/同步行为与预期不符的问题；编辑器默认展示所选 config 的逐步输入 schema 默认 JSON；并在本页完成备注、超算选择与 `createCase` 提交。

## Background

- 页面：`cbaldur-frontend-next/src/routes/add-cases/json.tsx`
- 逐步输入使用 `dynamicFormSlice` + YAML schema 默认值；提交 prototype 为按 panel 组织的 JSON。
- JSON 页当前误用旧 `useInput`/`inputSlice`，与逐步输入数据模型不一致。
- 上传失效：`Label` + `asChild` 渲染为 `Button` 后 `htmlFor` 无法触发隐藏 file input（`json.tsx` ~90–95）。
- 导出现状：仅把旧 `inputData` 写入 textarea，不下载文件。
- 入口 `/add-cases` 有 config 选择器；JSON 路由目前固定 `/add-cases/json`，未携带 `configName`。
- 逐步末页提交契约：`CaseJson` + `CaseJsonPrototype` + 四行备注 + 超算（`DynamicCommentPage`）。

## Requirements

- **R1** 修复上传：点击可打开文件选择器；选中文件后内容进入编辑器并校验 JSON 合法性。
- **R2** 「下载文件」：下载**当前编辑器文本**；非法 JSON 仍允许下载并 toast 警告。
- **R3** 「同步到编辑器」：将 `dynamicForm[configName]` 当前状态写入编辑器（含逐步输入已改内容）；不触发下载。无数据时按 design 处理（提示或 schema 初始化后同步）。
- **R4** 每次进入 JSON 页：编辑器用该 config 的 **schema 默认值**填充；不自动带入逐步已改内容（需用户点「同步」）。
- **R5** 入口「从 JSON 输入」导航携带已选 `configName`（路由如 `/add-cases/json/:configName`）。Ribbon 直达 JSON 时需有合理 fallback（默认 `baldur` 或入口选择逻辑，见 design）。
- **R6** 本页提交：合法 JSON + 备注 + 超算 → 写入 `dynamicForm` → 与逐步末页同契约调用 `createCase`；不跳转逐步末页。

## Acceptance Criteria

- [ ] **AC1** 点击上传可弹出文件选择器；合法 JSON 进入编辑器并显示有效状态。
- [ ] **AC2** 「下载文件」内容与当时编辑器文本完全一致；非法 JSON 仍可下载并有警告。
- [ ] **AC3** 「同步到编辑器」覆盖编辑器为当前 `dynamicForm[configName]`，不下载；逐步已改则反映改后状态。
- [ ] **AC4** 每次进入页面，编辑器为该 config 的 schema 默认配置（即使 form 已有改动也不自动带入）。
- [ ] **AC5** 入口选不同 config 进入后，默认内容随 config 变化；「同步」拉取对应 form 状态。
- [ ] **AC6** 本页填合法配置、备注、超算后可成功创建案例；请求体与逐步末页同契约；超算必选。

## Out of Scope

- 不改逐步输入向导字段逻辑本身（允许抽离共享工具函数供两端复用）。
- Namelist 导入路径不在本任务范围。
- 不改后端 `createCase` API 契约。

## Constraints

- 前端：`cbaldur-frontend-next`，沿用现有 shadcn/RTK/wouter 模式。
- 默认/同步/提交的 JSON 形状必须与逐步输入的 panel prototype 一致，不再使用旧 `inputSlice` block 结构作为主数据源。

# Design: JSON 新建算例上传/导出/默认/提交

## Boundaries

**In scope (frontend only)**

- `routes/add-cases/json.tsx` 重做数据源与按钮行为
- `routes/add-cases/index.tsx` 导航携带 `configName`
- `App.tsx` 路由：`/add-cases/json/:configName`（保留或重定向无参路径）
- `RibbonLayout` JSON 入口 fallback（默认 config，如 `baldur`）
- 抽离可复用工具：schema 默认 prototype 构建、panel→namelist 提交变换、备注四行归一化、文件下载（从 `DynamicCommentPage` 抽出，两端共用）

**Out of scope**

- 后端 API / OpenAPI
- Namelist 页、逐步向导 UI 流程（除共享工具抽取）

## Data model

- **Editor text**：本地 `useState` 字符串；合法性用 `JSON.parse` 标记。
- **Canonical form state**：`state.dynamicForm[configName]`，形状为  
  `{ [panelId]: { [fieldId]: value } }`（与逐步输入 / `CaseJsonPrototype` 一致）。
- **不再**以 `inputSlice` 作为 JSON 页主数据源。

## Key flows

```
入口选 config → /add-cases/json/:configName
  ├─ mount: buildSchemaDefaults(schema) → 写入编辑器（不写/不覆盖要求：可不改 dynamicForm，或仅内存默认）
  ├─ 上传文件 → 读文本 → 编辑器
  ├─ 下载文件 → Blob(编辑器原文)；非法 JSON 仍下载 + toast.warn
  ├─ 同步到编辑器 → stringify(dynamicForm[config] ?? 提示无数据)
  └─ 提交 → parse 编辑器 → setConfigData → transform → createCase
```

### R4 默认值（每次进入）

- 从 `state.inputs` 取 schema，对每个 panel/field 应用与 `initializePanel` 相同的 default 规则，得到完整 prototype 对象，`JSON.stringify(..., null, 2)` 填入编辑器。
- **不**把这份默认自动 `setConfigData` 覆盖用户已有逐步输入（除非提交时才写入）。避免「进 JSON 页毁掉逐步进度」。

### R3 同步

- 若 `dynamicForm[configName]` 存在：覆盖编辑器。
- 若不存在：toast 提示「尚无逐步输入数据」，可选地填入 schema 默认（与编辑器当前默认一致）——推荐仅提示，不静默伪造「已修改状态」。

### R6 提交

1. 校验：合法 JSON、对象形态、已选超算。
2. `setConfigData({ configName, data: parsed })`。
3. `CaseJsonPrototype = JSON.stringify(parsed)`；`CaseJson = JSON.stringify(transform(parsed, schema))`。
4. `Comment = normalizeCommentToFourLines(comment)`（复用末页默认备注文案与归一化）。
5. `createCase`；成功后跳转案例列表（与末页一致）。

## Upload button fix

- 去掉 `Label asChild` + `Button` 错误组合。
- 使用 `ref` 挂在隐藏 `<input type="file">`，按钮 `onClick={() => inputRef.current?.click()}`；或原生 `<label htmlFor>` 包纯展示元素（非 asChild Button）。

## Routing / Ribbon

| 入口 | 行为 |
|------|------|
| `/add-cases` 卡片 | `getNavigationPath`：json → `/add-cases/json/${selectedConfig}` |
| Ribbon「导入 JSON」 | `/add-cases/json/baldur`（或当前唯一/首选 config）；无 schema 时 toast |
| 旧 `/add-cases/json` | redirect 到带默认 config 的路径 |

## Shared utilities (suggested)

| 模块 | 职责 |
|------|------|
| `utils/dynamicFormDefaults.ts`（或 hooks） | `buildDefaultPanelData(schema)` |
| `utils/caseSubmission.ts` | `transformPanelDataForSubmission`、`normalizeCommentToFourLines`、`DEFAULT_CASE_COMMENT` |
| `utils/downloadTextFile.ts` | 通用文本下载 |

`DynamicCommentPage` 改为调用共享函数，行为保持不变。

## Compatibility

- 已存案例 / 后端契约不变。
- 旧静态 `inputSlice` 向导仍可存在，但 JSON 页不再依赖它。
- 抽离末页逻辑时保持提交结果字节级语义一致（同一输入 → 同一 `CaseJson`）。

## Trade-offs

| 选择 | 理由 |
|------|------|
| 进页默认不写 Redux | 保护逐步输入进度；「同步」才读 form |
| 提交才 `setConfigData` | 编辑器草稿与 form 解耦，直到用户确认提交 |
| 非法 JSON 仍可下载 | 备份半成品；提交仍严格校验 |
| 本页含超算+备注 | 避免跳回逐步末页的步骤语义 |

## Rollback

- 回退 `json.tsx` / 路由 / Ribbon / 抽离工具的提交即可；无 DB migration。
- 若共享工具有回归，可先让 `DynamicCommentPage` 内联恢复，再修 JSON 页。

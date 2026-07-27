# Implement: JSON 新建算例上传/导出/默认/提交

## Checklist

1. **抽离共享工具**
   - 从 `DynamicCommentPage` 抽出：`normalizeCommentToFourLines`、`DEFAULT_CASE_COMMENT`、`transformDataForSubmission`（改为纯函数，入参 schema + panelData）。
   - 新增 `buildDefaultPanelData(schema)`，default 规则与 `dynamicFormSlice.initializePanel` 一致。
   - 新增 `downloadTextFile(filename, text)`。
   - `DynamicCommentPage` 改为调用共享函数；手动确认逐步末页导出/提交行为不变。

2. **路由与入口**
   - `App.tsx`：增加 `/add-cases/json/:configName`；无参 `/add-cases/json` redirect 到 `baldur`（或列表首个 config）。
   - `add-cases/index.tsx`：json 选项导航带上 `selectedConfig`。
   - `RibbonLayout`：JSON 按钮改为 `/add-cases/json/baldur`（或等价 fallback）；`isAddCasesJsonPath` 匹配带参路径。

3. **重写 `json.tsx`**
   - 从路由读 `configName`；从 `state.inputs` 取 schema。
   - Mount/`configName` 变化：编辑器 = `buildDefaultPanelData` 的 pretty JSON。
   - 上传：file input `ref` + 按钮 click；读文件进编辑器。
   - 下载：编辑器原文；非法则 toast.warn 仍下载。
   - 同步：有 `dynamicForm[configName]` 则写入编辑器；否则 toast。
   - UI：备注 textarea（默认四行模板）、超算 select（复用现有 supercomputers query / 末页控件模式）。
   - 提交：校验 → `setConfigData` → `createCase` → 成功跳转 `/cases`。
   - 移除对 `useInput` 的依赖。

4. **文案与按钮布局**
   - 明确三个动作：「上传」「下载文件」「同步到编辑器」；去掉易混淆的「导出到编辑器」单按钮。
   - 「导入 JSON」若仍保留，语义应为「把编辑器写入 form」或并入提交前步骤——推荐提交时写入，可不单独保留第三张「导入」卡，避免与「同步」对打。

5. **验证**
   - `cd cbaldur-frontend-next && npm run lint`
   - 手工：上传选文件；下载与编辑器一致；非法 JSON 下载有警告；进页为 schema 默认；逐步改参后点同步可见改动；本页提交成功出案例。

## Validation commands

```bash
cd cbaldur-frontend-next && npm run lint
cd cbaldur-frontend-next && npx tsc --noEmit
```

## Risky files / rollback points

| 文件 | 风险 |
|------|------|
| `DynamicCommentPage.tsx` | 抽离提交变换若出错影响主创建路径 → 优先 diff 审查 transform |
| `json.tsx` | 整页重写 |
| `App.tsx` / `RibbonLayout.tsx` / `index.tsx` | 路由断裂 |

Rollback：还原上述文件与新增 utils。

## Review gate before `task.py start`

- [x] `prd.md` 已收敛（无未决开放问题）
- [x] `design.md` / `implement.md` 已就绪
- [ ] 用户确认规划可执行
- [ ] `implement.jsonl` / `check.jsonl` 已填真实 spec 条目

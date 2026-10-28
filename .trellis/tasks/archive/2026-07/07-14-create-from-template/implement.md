# Implement: 以此为模板新建

## Checklist

1. **`dynamicFormSlice`**：新增 `setConfigData` action（整 config 替换写入）；export。
2. **`cases/index.tsx` `handleNewWith`**：
   - `jsonOrNamelist === true` → `setLocation(\`/add-cases/namelist?caseId=${id}\`)`（注意当前传参：true 时第二参是 id）。
   - else → parse `caseJsonPrototype`；失败 toast return；成功则 `resetConfig` + `setConfigData` + 设置 navigation config + `setLocation('/add-cases/dynamic/baldur/0')`。
3. **类型/import**：从 slice 引入 actions；`useAppDispatch` 或现有 dispatch 模式对齐仓库风格。
4. **禁用条件复核**：保持 `caseJsonPrototype === null` disabled；Namelist 路径依赖 caseId，确认列表行有 id（有）。
5. **手动验证**：
   - Namelist 算例：按钮 → namelist 预填 → 可提交新 case。
   - Dynamic 算例：按钮 → dynamic 首页字段已预填 → Comment 空 → 提交新 case。
   - 非法/空 prototype：不跳转或 disabled。
6. **`npm run lint`**（`cbaldur-frontend-next`）。

## Validation Commands

```bash
cd cbaldur-frontend-next && npm run lint
```

（无单元测试；手测 AC1–AC7。）

## Risky Files / Rollback

| File | Risk |
|------|------|
| `src/redux/slices/dynamicFormSlice.ts` | 新增 action，勿改 `initializePanel` 语义 |
| `src/routes/cases/index.tsx` | 传参分支：true=id，false=prototype 字符串 |

Rollback：还原上述两文件相关改动。

## Pre-start Gates

- [x] prd.md converged
- [x] design.md written
- [x] implement.md written
- [ ] User review approved → `task.py start`

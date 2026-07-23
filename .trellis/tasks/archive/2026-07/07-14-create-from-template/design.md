# Design: 以此为模板新建

## Architecture / Boundaries

- **仅前端**：复用现有 Create 接口，不新增后端克隆 API。
- **边界**：用户算例列表 → 创建流程预填；不改 admin、不改 CaseModel。

## Data Flow

### Namelist (`jsonOrNamelist === true`)

```
cases list click
  → setLocation(`/add-cases/namelist?caseId=${id}`)
  → namelist.tsx: useGetCaseQuery(id) → setNamelistContent(caseNamelist)
  → user edits → CreateCaseByNamelist
```

### Dynamic (`jsonOrNamelist === false`)

```
cases list click (with caseJsonPrototype string)
  → JSON.parse(prototype)
  → dispatch resetConfig({ configName: 'baldur' })
  → dispatch setConfigData({ configName: 'baldur', data: parsed })  // new action
  → dispatch setCurrentConfig({ name: 'baldur', totalPanels })
  → setLocation('/add-cases/dynamic/baldur/0')
  → panels initializePanel (skips defined fields)
  → user edits → DynamicCommentPage CreateCase (new case)
```

## Contracts

### New Redux action (preferred)

`dynamicFormSlice.setConfigData`:

```ts
{ configName: string; data: { [panelId: string]: { [fieldId: string]: ... } } }
```

Behavior: replace `state[configName]` with `data` (after caller reset or action does replace).

### Existing pieces reused

- `useGetCaseQuery` + namelist page URL param
- `resetConfig` / `initializePanel` semantics
- `CreateCase` / `CreateCaseByNamelist` unchanged

## Trade-offs

| Option | Pros | Cons | Choice |
|--------|------|------|--------|
| Redux inject vs URL | 无长度限制、不泄漏 | 刷新后丢失预填 | Redux（D3） |
| dynamic vs JSON page | 与主创建路径一致、shape 匹配 | 略多状态 | dynamic（D1） |
| hardcode baldur | 简单 | 未来多 config 需改 | 可接受（D2） |

## Compatibility / Rollback

- 无 DB 迁移；回滚即还原 `handleNewWith` 与 slice 新增 action。
- 旧 case 的 `CaseJsonPrototype` 若为空/`{}`：按钮 disabled 或 parse 后空表单；非法 JSON toast。

## Error Handling

- `JSON.parse` 失败 → toast 错误，不导航。
- Namelist 无 `caseId` 有效数据 → 现有 GetCase 错误表现即可。

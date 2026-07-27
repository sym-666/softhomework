# Add-Cases JSON Path

> Contracts for creating cases via `/add-cases/json/:configName`.

---

## Scope / Trigger

Use this spec when touching:
- `routes/add-cases/json.tsx`
- Shared case submission helpers under `src/utils/caseSubmission.ts`, `dynamicFormDefaults.ts`, `downloadTextFile.ts`
- Navigation into the JSON path (`add-cases/index.tsx`, `RibbonLayout`, `App.tsx` routes)
- `DynamicCommentPage` submit/export (shares the same transform helpers)

## Signatures

```typescript
// src/utils/dynamicFormDefaults.ts
buildDefaultPanelData(schema: ConfigSchema): PanelFormData

// src/utils/caseSubmission.ts
DEFAULT_CASE_COMMENT: string
normalizeCommentToFourLines(raw: string): string
transformPanelDataForSubmission(
  schema: ConfigSchema,
  allPanelData: PanelFormData,
): Record<string, Record<string, unknown>>

// src/utils/downloadTextFile.ts
downloadTextFile(filename: string, text: string, mimeType?: string): void
```

`createCase` body (unchanged API):
- `CaseJson`: stringified namelist-keyed object from `transformPanelDataForSubmission`
- `CaseJsonPrototype`: stringified panel-keyed `PanelFormData`
- `Comment`: exactly four lines via `normalizeCommentToFourLines`
- `SuperComputer`: required non-empty string

## Contracts

| Concern | Rule |
|---------|------|
| Canonical form state | `state.dynamicForm[configName]` panel map — **not** legacy `inputSlice` |
| Route | `/add-cases/json/:configName`; bare `/add-cases/json` redirects to `baldur` |
| Enter page | Editor = `buildDefaultPanelData(schema)` pretty JSON; **do not** auto-`setConfigData` (preserves stepwise progress) |
| Sync to editor | Read `dynamicForm[configName]` into editor; if missing → toast, no fake “edited” state |
| Download | Always current editor text; invalid JSON still downloads + warning toast |
| Upload | Hidden `<input type="file">` opened via `ref.click()` (or plain `<label htmlFor>`) |
| Submit | Parse editor → `setConfigData` → transform → `createCase`; supercomputer required |

## Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| Invalid JSON in editor, download | Allow download + `toast.warning` |
| Invalid JSON / non-object, submit | Block + error toast |
| No supercomputer, submit | Block + error toast |
| Sync with empty `dynamicForm[config]` | Toast「尚无逐步输入数据」; do not invent data |
| Unknown `configName` / missing schema | Show「未找到配置」; do not crash |

## Good / Base / Bad Cases

- **Good**: Enter `baldur` JSON page → editor shows schema defaults → edit → choose SC → submit → case created with matching prototype/namelist JSON.
- **Base**: Stepwise edits exist → enter JSON page still shows schema defaults → click「同步到编辑器」→ editor shows edited form.
- **Bad**: Using `Label asChild` + `Button` with `htmlFor` for file upload (click does nothing). Using `useInput`/`inputSlice` as JSON page source of truth.

## Tests Required

When tests exist for this area, assert:
- `buildDefaultPanelData` matches `initializePanel` default rules for bool/number/short_array/long_array
- `normalizeCommentToFourLines` always yields exactly 4 lines
- Download helper receives exact editor string
- Submit payload keys: `CaseJson`, `CaseJsonPrototype`, `Comment`, `SuperComputer`

## Wrong vs Correct

### Wrong — file upload trigger

```tsx
<Label htmlFor="json-file-input" asChild>
  <Button>选择文件</Button>
</Label>
```

`asChild` makes the Label a Button; `htmlFor` on a button does not open the file input.

### Correct

```tsx
<input ref={fileInputRef} type="file" accept=".json" className="hidden" />
<Button type="button" onClick={() => fileInputRef.current?.click()}>
  选择文件
</Button>
```

### Wrong — enter page overwrites stepwise progress

```tsx
dispatch(setConfigData({ configName, data: buildDefaultPanelData(schema) }));
```

### Correct

```tsx
setJsonInput(JSON.stringify(buildDefaultPanelData(schema), null, 2));
// setConfigData only on successful submit
```

## Design Decisions

1. **Split download vs sync** — download mirrors editor; sync pulls Redux form (possibly stepwise-edited).
2. **Enter = schema defaults** — predictable clean slate; sync is the explicit bridge to stepwise state.
3. **Shared utils with DynamicCommentPage** — one transform/comment contract for both create paths.

## Related

- Stepwise end page: `components/add-cases/DynamicCommentPage.tsx`
- Form store: `redux/slices/dynamicFormSlice.ts`

# Research: create-from-template

## Entry

- `cbaldur-frontend-next/src/routes/cases/index.tsx`
  - Button: `cases.button.createFromTemplate`
  - `handleNewWith(jsonOrNamelist, jsonProtypeOrNamelistPrototype)` is TODO
  - When `jsonOrNamelist`: passes `row.id`; else passes `row.caseJsonPrototype`
  - Disabled when `caseJsonPrototype === null`

## Namelist path (already works)

- `/add-cases/namelist?caseId=` in `namelist.tsx`
- `useGetCaseQuery` → `caseData.caseNamelist` → editor content

## Dynamic path (to implement)

- Submit stores `CaseJsonPrototype = JSON.stringify(allPanelData)` where
  `allPanelData = state.dynamicForm[configName]` shape `{ [panelId]: { [fieldId]: value } }`
- `dynamicFormSlice.initializePanel` only sets defaults when field is `undefined`
- Need `setConfigData` (or equivalent) to replace entire config bucket after `resetConfig`
- Default config name: `baldur` (`navigationSlice` default; only schema)

## Backend

- `CaseModel`: CaseJson, CaseJsonPrototype, CaseNamelist, JsonOrNamelist; no configName
- CreateCase → JsonOrNamelist=false; CreateCaseByNamelist → true, prototype `{}`

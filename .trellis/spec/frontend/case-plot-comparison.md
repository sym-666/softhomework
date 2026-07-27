# Case Plot Comparison Mode

## Convention: Wire `nowCases` before calling across-cases plot APIs

**What**: On the case detail chart page (`routes/cases/Case.tsx`), mode
`nowMode === 'case'` must keep mutable `nowCases: { caseId, times[] }[]`
where `caseId` is the case **UUID string**, and only request plot/CSV with
**effective** entries whose `times.length > 0`.

**Why**: `POST /api/Plot/GetPlotAcrossCases` and
`DownloadPlotCsvAcrossCases` already accept `cases[]`, but an empty or
setter-less `nowCases` silently produces no chart. Time comparison already
had a full multi-select UI; case comparison must mirror that pattern per
case.

**Behavior**:

- Candidate cases come from `GET /api/Case/GetCases` (`CaseListItem`),
  filtered to `status === 'success'`, including the current case UUID `id`.
- Entering case mode seeds the current case and, when available, the current
  single-slice `nowTime`.
- Per selected case, times come from `GetTimes` (reuse page `timeOptions` for
  the current case; lazy-load for others). Invalidate cached times when
  `nowType` changes.
- Backend series key remains `time = "{caseUuid}:{time}"`; do not change that
  format without updating the pivot/legend path. UI display of per-user
  sequence uses list field `caseId` (int), not the UUID. Legend / tooltip
  labels must render as `#<caseId> @ <time>` (e.g. `#42 @ 1.234e5`); never
  show the raw UUID in the chart legend.

**Example**:

```ts
const [nowCases, setNowCases] = useState<{ caseId: string; times: string[] }[]>(
  [],
);
const effectiveNowCases = nowCases.filter((c) => c.times.length > 0);

if (nowMode === 'case' && effectiveNowCases.length > 0) {
  await getPlotAcrossCases({
    type: nowType,
    cases: effectiveNowCases,
    x: nowX!,
    y: nowY!,
  });
}
```

## Common Mistake: State without UI

**Symptom**: Ribbon shows「算例对比」but the chart never loads multi-case
series.

**Cause**: `nowCases` declared without a setter / no sidebar to populate it.

**Fix**: Add `setNowCases`, success-case picker UI, and gate fetches on
`effectiveNowCases`.

**Prevention**: Any new plot mode that depends on multi-entity selection must
ship state + sidebar controls + fetch gate in the same change.

## Common Mistake: `gfile` as a plot type

**Symptom**: Ribbon includes「G 文件 / Gfile」as a data type; chart stays empty
despite `GetTimes` returning values.

**Cause**: `gfile_*.dat` is EFIT text, not CSV. `PlotService` only reads CSVs;
`GetGFile` exists for download/parse but is not wired to the chart.

**Fix**: Keep `gfile` out of plot `typeOptions`. Download remains via the
G-file button. Do not add `gfile` back to plotting without a dedicated
GetGFile → chart path.

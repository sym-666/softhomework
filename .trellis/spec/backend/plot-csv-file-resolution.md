# Plot CSV File Resolution

## Scenario: Resolve result CSVs by type + time token

### 1. Scope / Trigger

`PlotService` must open the same CSV that `GetTimes` enumerated for a given
`type` + `time`. Animation (`GetPlotAcrossTimes`) and case comparison
(`GetPlotAcrossCases`) depend on this alignment. Applies when adding plot
types, renaming result files, or changing time-token extraction.

### 2. Signatures

- `IList<string> GetTimes(Guid userId, Guid caseId, string type)`
- `IList<PlotModel> GetPlotWithVariables(...)` / `GetPlotAcrossTimes` /
  `GetPlotAcrossCases` (all resolve files via shared helpers)

### 3. Contracts

- Time tokens returned by `GetTimes` must equal tokens extracted from the
  chosen filename for that type (helpers: `ExtractTimeToken`, `FindCsvFile`).
- Default CSV pattern: `comma_<type>_<time>.dat.csv` → token = third `_`
  segment with `.dat.csv` stripped.
- Special cases: `YF` ignores time (pseudo-token `不区分`); `XF` / `en` use
  their own substring/split rules; `gfile` lists `gfile_*.dat` times only and
  is **not** a CSV plot type in the UI.
- Prefer exact token match over `Contains(time)` / `Contains(type)` alone.

### 4. Validation & Error Matrix

| Condition | Boundary behavior |
| --- | --- |
| Matching CSV found | Read rows for that file |
| No matching CSV for a time | Skip that frame (across-times/cases); log; do not abort siblings |
| Directory missing | Return empty list |
| Corrupt CSV for one time | Catch, skip that frame, continue |

### 5. Good/Base/Bad Cases

- Good: `GetTimes` returns `70.0000` for `comma_prof_70.0000.dat.csv`;
  across-times opens that same file for `time=70.0000`.
- Base: `YF` returns `["不区分"]` and opens the first `*YF*.csv`.
- Bad: `Where(name.Contains(type) && name.Contains(time)).First()` — substring
  collisions and token mismatch break profile animation preload.

### 6. Tests Required

- `dotnet build` after `PlotService` changes.
- Manual: `prof` animation preload with ≥2 times succeeds.
- Manual: one missing time does not empty the whole across-times response when
  other frames exist.

### 7. Wrong vs Correct

#### Wrong

```csharp
dirPath.GetFiles("*.csv")
    .Where(c => c.Name.Contains(type) && c.Name.Contains(time))
    .ToList()[0];
```

#### Correct

Extract the time token with the same rules as `GetTimes`, then
`FindCsvFile(dir, type, time)` with exact equality (and per-time try/catch for
batch APIs).

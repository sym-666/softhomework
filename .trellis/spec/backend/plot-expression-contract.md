# Plot Expression Contract

## Scenario: One-Dimensional Multi-Variable Expressions

### 1. Scope / Trigger

The analysis chart lets users derive its selected Y series in the browser from
`x`, `y`, and additional result columns. The storage-to-service-to-API-to-UI
path is a cross-layer contract: every auxiliary value must come from the same
CSV row as the plotted point.

### 2. Signatures

- `POST /api/Plot/GetPlotWithVariables` accepts
  `GetPlotWithVariablesBody` for a single frame.
- `POST /api/Plot/GetPlotAcrossTimes` and
  `POST /api/Plot/GetPlotAcrossCases` accept optional `Variables` lists.
- `IPlotService.GetPlotWithVariables(int userId, GetPlotWithVariablesBody body)`
  is the single-frame service entry point.

### 3. Contracts

Request fields:

- `CaseId`, `Type`, `Time`, `X`, and `Y` select the existing plotted rows.
- `Variables` is optional and contains original CSV header names to return as
  auxiliary values.

Each `PlotModel` continues to expose `x`, `y`, `type`, and `time`. When
requested, its optional `variables: Dictionary<string, double>` maps each
requested source header to the value from that exact CSV row. Omitted
`Variables` must preserve existing plot and export behavior.

The backend reads raw numeric data only. It never accepts, parses, or executes
formula text; expression validation and evaluation remain frontend concerns.

### 4. Validation & Error Matrix

| Condition | Boundary behavior |
| --- | --- |
| No `Variables` | Return the established X/Y response shape. |
| Valid requested headers | Return their numeric values in `variables`. |
| Unavailable header or non-numeric cell | The plot read fails; the frontend keeps the original row and displays its formula error. |
| Unknown expression identifier | Reject in the frontend before any auxiliary request. |
| Missing auxiliary response value or non-finite calculation | Keep the original Y value and display a formula error. |

### 5. Good/Base/Bad Cases

- Good: a formula `x + v3` requests the source header mapped to `v3`; every
  plotted row includes that header's same-row numeric value.
- Base: `x * 2` sends no `Variables` and uses the established plot endpoint
  behavior.
- Bad: returning an auxiliary column from a separately fetched or mismatched
  time/case frame; this silently misaligns values and must not be implemented.

### 6. Tests Required

- Build the backend after model, controller, or service changes.
- Build and lint frontend call sites after changing the serialized contract.
- Verify a single-frame expression, a time comparison, and a one-dimensional
  animation using an inserted auxiliary alias.
- Verify `x`/`y` expressions and plot CSV exports without auxiliary variables
  retain their existing behavior.

### 7. Wrong vs Correct

#### Wrong

Fetch each auxiliary variable through an unrelated plot request and combine
arrays by index in the UI.

#### Correct

Have `PlotService` read requested auxiliary headers during the same CSV-row
iteration that produces `x` and `y`, and return them as the row's optional
`variables` dictionary.

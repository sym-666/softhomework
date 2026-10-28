# Multi-Variable Expression Design

## Scope and Boundaries

The feature remains a client-side chart transformation. The backend reads the
existing result CSV data and returns requested auxiliary columns alongside the
current `x`/`y` fields. It does not parse, evaluate, store, or trust user
expressions.

The feature supports one-dimensional single, comparison, and animation data
paths. The equilibrium two-dimensional contour path remains unchanged.

## Contract

Extend `PlotModel` with an optional `variables` dictionary keyed by original
CSV header. Extend the time and case request bodies with an optional
`Variables` list. Add a POST endpoint for the single-frame variant so a JSON
body can carry variable header names without query-string serialization
ambiguity. Existing GET and comparison requests remain valid when `Variables`
is omitted.

For every returned row, `variables` contains only the requested columns.
Requested columns are read from the same CSV row as `x` and `y`, preserving
row alignment and the result type/time/case selected by the existing path.

## Frontend Flow

1. Derive a deterministic variable catalog from `headerOptions`: `x` and `y`
   represent the selected axes; all remaining headers receive stable `vN`
   aliases based on header order.
2. The formula menu displays the source header and alias. Selecting an item
   inserts its alias at the current input cursor.
3. On Apply, parse with Nerdamer and call `variables()` to obtain referenced
   identifiers. Reject identifiers outside the current catalog before storing
   the applied expression.
4. Convert referenced `vN` aliases back to source headers and include only
   those headers in plot requests.
5. After receiving a plot, retain the existing `x`/`y` renaming and hydrate
   each requested alias from its row's `variables` dictionary. Build a function
   with the referenced variable list and calculate the selected Y value.
6. A non-finite result or a missing referenced value leaves that row unchanged
   and reports an error rather than corrupting the rendered series.

The same mapping and hydration helpers are used by the case page and the
one-dimensional animation hook so each frame evaluates against its own data.

## Compatibility

- Existing callers that omit extra variables receive the original chart shape
  plus an empty/omitted optional field; existing exports continue to use `x`
  and `y`.
- `x`/`y` expressions continue through the existing endpoints and produce the
  same transformed Y values.
- The formula is not sent to the backend, avoiding server-side expression
  evaluation and injection risk.

## Failure and Rollback

Invalid identifiers, syntax failures, missing response values, non-numeric
CSV data, and non-finite evaluation values produce a localized formula error
and do not replace chart data. The change is reversible by omitting the new
optional request fields and frontend hydration behavior; existing endpoint
contracts stay callable.

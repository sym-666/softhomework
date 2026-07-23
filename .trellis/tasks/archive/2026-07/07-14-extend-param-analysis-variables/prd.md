# Extend parameter analysis variables

## Goal

Extend the one-dimensional case-analysis expression feature so users can use
additional result variables beyond the currently selected X and Y axes.

## Confirmed Facts

- The expression bar in `cbaldur-frontend-next/src/routes/cases/Case.tsx`
  currently validates and evaluates expressions with Nerdamer using only the
  positional variables `x` and `y`.
- Evaluation is performed in the browser for each plotted point and replaces
  the selected Y value; it does not change source results on the server.
- The available result columns are already exposed through the existing
  headers API for the currently selected result type.
- The current plot API returns exactly two requested columns as `x` and `y`.

## Requirements

- Users can reference result variables other than the selected X and Y axes in
  a one-dimensional expression.
- Existing expressions using `x` and `y` and the four arithmetic operators
  remain supported.
- Extra variable values must correspond to the displayed case, result type,
  and time (or the relevant comparison/animation frame).
- The capability applies to single-slice, time-comparison, case-comparison,
  and one-dimensional animation views. It remains unavailable for the
  two-dimensional contour view, where the expression bar is already hidden.
- The expression UI must make the supported variable names discoverable and
  report understandable validation or data-loading errors.
- The expression bar provides a menu of available result variables; choosing
  one inserts a supported expression identifier at the cursor. `x` and `y`
  remain available as aliases for the selected axes.
- The feature must not persist or mutate raw result data.

## Acceptance Criteria

- [ ] A valid expression can combine X, Y, and at least one additional
  available result variable, and the chart reflects the calculated Y values.
- [ ] Existing `x`/`y` arithmetic expressions remain valid and preserve their
  current behavior.
- [ ] Unsupported identifiers, invalid syntax, and unavailable variable data
  produce a user-visible error without breaking chart rendering.
- [ ] Variable data remains aligned with each chart mode and frame.
- [ ] Existing plot rendering, export behavior, and two-dimensional views
  continue to work without an expression.

## Variable Naming

- The UI presents source result headers to users. Additional result columns
  use stable `vN` aliases (for example, `te (v3)`), while `x` and `y` remain
  aliases for the selected axes. The menu inserts the appropriate alias at the
  input cursor so users do not need to type or derive it.

## Out of Scope

- Persisting derived expressions or sending derived values to the backend.
- Adding functions beyond the expression engine's currently supported syntax.

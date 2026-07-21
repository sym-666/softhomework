# Implementation Plan

1. Add optional auxiliary-column fields to backend plot request/response
   models, and add a JSON-body single-frame plot endpoint.
2. Update `PlotService` to populate requested auxiliary values from the same
   CSV rows in all one-dimensional plot retrieval paths.
3. Add typed RTK Query definitions and calls for the extended plot requests.
4. Add reusable expression catalog, validation, hydration, and evaluation
   helpers on the frontend; use Nerdamer's parsed variable list rather than
   text matching.
5. Update `Case.tsx` to request active auxiliary columns, insert menu aliases
   at the formula cursor, and apply derived Y values for single and comparison
   plots.
6. Update `usePlotTimeAnimation` so its cache identity, preload request, and
   per-frame transformation include the active auxiliary columns.
7. Add Chinese and English UI text for the variable menu and formula errors.
8. Run backend build and frontend lint/build. Manually verify an `x`/`y`
   expression and an expression using an inserted extra alias in single,
   comparison, and animation modes.

## Risk Checks

- Verify optional fields preserve existing downloads and ordinary plot calls.
- Verify a header used as X or Y does not also receive an auxiliary alias.
- Verify type/time/case changes invalidate the request and animation cache.
- Verify formulas with unknown aliases or invalid results show an error without
  replacing rendered data.

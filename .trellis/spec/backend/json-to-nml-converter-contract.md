# JSON → Namelist Converter Contract

> Managed `JsonToNmlConverter` used by pipeline `convert` steps. Replaces the removed `Others/cbaldur-json-to-nml` binary.

---

## 1. Scope / Trigger

Apply when changing JSON case submission, `PipelineExecutor` convert steps, namelist header/comment rules, or `Utils/JsonToNmlConverter.cs`.

Out of scope: namelist-only submission (convert step skipped via `condition: json`), plot sandbox / `ExecuteCode` (deprecated).

---

## 2. Signatures

```csharp
// Utils/JsonToNmlConverter.cs
public static string Convert(string jsonText, string commentText);

// PipelineExecutor (caller)
internal static string ProcessComment(string? comment); // exactly 4 lines, no trailing newline after line 4
```

Pipeline YAML `convert` config (file paths only — no `binary` / `args`):

| Field | Default | Meaning |
|-------|---------|---------|
| `input_file` | `input.json` | JSON object-of-objects |
| `comment_file` | `comment` | 4-line comment text |
| `output_file` | `jobxdat` | Fortran namelist output |

---

## 3. Contracts

**Input JSON**: root object; each property is a namelist group object of scalar / bool / array values.

**Output layout**:

1. Header line: `F  0  0  0`
2. Comment text as provided (caller must run `ProcessComment` first)
3. For each top-level JSON property in order:
   - Group name: `nmread\d+` → `nmread`; otherwise property name as-is
   - `&{group}` … assignments … `/`
4. Keys inside a group: ordinal string sort
5. Assignment line: `  {key} = {value}` (2 spaces)
6. Bool → `.true.` / `.false.`; arrays comma-joined with no spaces
7. **Every physical line ≤ 80 characters** (including indent). Wrap array values at commas using continuation prefix `     ,` (5 spaces + comma)

**Equivalence for tests**: compare with `NormalizeNamelist` that merges continuation lines — do not require byte-identical wrapping vs historical binary (~100-col wraps).

**Others/**: keep SSH keys only (`*.key`). Do not reintroduce `cbaldur-json-to-nml`, `fsubmit`, or `wazero` on the convert / case-submit path.

**Deprecated**: `CaseService.ExecutePythonCode` throws `NotSupportedException` (plot sandbox disabled).

---

## 4. Validation & Error Matrix

| Condition | Behavior |
|-----------|----------|
| JSON root not an object | `InvalidOperationException` |
| Group value not an object | `InvalidOperationException` |
| Unsupported JSON value kind | `InvalidOperationException` |
| Comment fewer/more than 4 lines | Fixed by `ProcessComment` before convert |
| `ExecutePythonCode` called | `NotSupportedException` |

---

## 5. Good / Base / Bad Cases

| Case | Input | Expect |
|------|-------|--------|
| Good | Fixture `data/1/163` | `NormalizeNamelist(actual) == NormalizeNamelist(jobxdat)`; all lines ≤ 80 |
| Base | Single group, short scalars | One `&group` block, no continuations |
| Bad | JSON array at root | Throws |

---

## 6. Tests Required

- `CBaldurBackendREST.Tests` converter test against `data/1/163`
- Assert normalized equality and max line length 80
- Must not require any binary under `Others/`

---

## 7. Wrong vs Correct

| Wrong | Correct |
|-------|---------|
| Shell out to `Others/cbaldur-json-to-nml` from `ExecuteConvert` | Call `JsonToNmlConverter.Convert` in-process |
| Put remote workdirs in `appsettings` (`CbaldurProduction` / `CbaldurData`) | Keep paths in `Schemas/baldur-pipeline.yml` `workdir` |
| Assume byte-identical wrap to old Rust binary | Assert via `NormalizeNamelist` + ≤80 col rule |

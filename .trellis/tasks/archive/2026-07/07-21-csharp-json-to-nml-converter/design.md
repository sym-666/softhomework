# Design: C# JSON → namelist converter

## Architecture

```
PipelineExecutor.ExecuteConvert
        │
        ▼
JsonToNmlConverter.Convert(jsonText, commentText) → namelist text
        │
        ▼
write {output_file} under localDir
```

- New type: `cbaldur-backend/Utils/JsonToNmlConverter.cs`（静态或轻量无状态类，与 `ProcessProxy` 同层）。
- `ExecuteConvert` 读取 `input_file` / `comment_file`，调用转换器，写入 `output_file`；**不再**解析 `binary`/`args`，不调用 `ProcessProxy.RunBinary`。
- YAML `convert` 块仅保留 `input_file` / `comment_file` / `output_file`（及既有 `condition`）。

## Conversion contract (from case 163)

1. Emit header line `F  0  0  0`.
2. Emit comment exactly as provided (caller/`ProcessComment` 已保证 4 行；转换器不改写 comment 语义，也不对 header/comment 折行)。
3. Parse JSON as object-of-objects (`JsonDocument`).
4. For each top-level property in order:
   - Namelist group name = property name with trailing digits stripped when name matches `nmread\d+` → `nmread`; otherwise use name as-is.
   - Emit `&{group}` then assignments then `/`.
5. Within a group, sort keys with ordinal string sort.
6. Value formatting:
   - `true`/`false` → `.true.` / `.false.`
   - arrays → join elements with `,` (no spaces)
   - numbers → match existing golden semantics (integers without decimal; floats in compact form compatible with 163 / Rust Display, e.g. large magnitudes like `7e19`). Prefer `JsonElement.GetRawText()` only when it already matches namelist style; otherwise normalize (implementation detail driven by tests).
7. Line layout:
   - Assignment: `  {key} = {value}` (2 leading spaces).
   - If a line would exceed **80** characters, wrap value commas onto continuation lines prefixed with `     ,` (5 spaces + comma), each continuation also ≤ 80.
   - Never break mid-token (only at commas between array elements, or before starting a too-long single token — if a single token alone exceeds remaining width, still emit it on its own line and accept test failure only if fixture has such tokens; 163 arrays are comma-wrappable).

## Pipeline / schema changes

- `Schemas/baldur-pipeline.yml`: remove `binary` and `args` under both convert steps.
- `Schemas/pipeline-schema.json`: remove or mark obsolete `binary`/`args`; keep file path fields.
- `Models/PipelineModel.ConvertConfig`: drop `Binary`/`Args` (or leave unused and unused by executor — prefer delete to avoid drift).

## Compatibility

- Namelist submission path unchanged (`condition: json` skips convert).
- `Others/cbaldur-json-to-nml` remains on disk for manual comparison; not referenced by runtime/tests.
- Dockerfile / compose：确认无 COPY/依赖该二进制（当前主要是 wazero）；无需为删除文件改 Docker，因本任务不删文件。

## Testing

- Rewrite `ConverterTests` to call `JsonToNmlConverter` with `data/1/163` fixtures.
- Assert `NormalizeNamelist(actual) == NormalizeNamelist(expected)`.
- Assert every output line `Length <= 80`.
- Do not require binary on disk.

## Risks / trade-offs

| Risk | Mitigation |
|------|------------|
| Number formatting drift vs golden (`7e19` vs `7e+19` / full int) | Drive format helper with 163 fixture; compare after NormalizeNamelist |
| Comment line > 80 after ProcessComment merge | Out of converter wrap scope; rare; document |
| YAML still documents old binary | Update schema descriptions in same change |

## Rollback

- Revert convert step to `RunBinary` + restore YAML `binary`/`args`.
- Binary file never removed, so rollback does not need restore from git LFS/elsewhere beyond code revert.

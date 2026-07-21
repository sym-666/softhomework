# Implement: C# JSON → namelist converter

## Checklist

1. [ ] Add `Utils/JsonToNmlConverter.cs` implementing the contract in `design.md` (80-col wrap, nmread rename, sorted keys, bool/array/number formatting).
2. [ ] Change `PipelineExecutor.ExecuteConvert` to read input/comment files, call converter, write output; remove binary process invocation; update `ProcessComment` doc comment if it still names the binary.
3. [ ] Update `ConvertConfig` / `pipeline-schema.json` / `baldur-pipeline.yml` to drop runtime `binary`/`args`.
4. [ ] Rewrite `CBaldurBackendREST.Tests/ConverterTests.cs` for C# converter + fixture `data/1/163` + line-length ≤ 80 + `NormalizeNamelist` equality.
5. [ ] **Validate first**: `dotnet test` in `cbaldur-backend` (or test project) — must pass without `cbaldur-json-to-nml`.
6. [ ] Grep confirm no remaining runtime references to `cbaldur-json-to-nml` under `Services/` / tests (file may remain under `Others/`).

## Validation commands

```bash
cd cbaldur-backend && dotnet test --filter "FullyQualifiedName~Converter"
# or full:
cd cbaldur-backend && dotnet test
```

```bash
rg -n 'cbaldur-json-to-nml' cbaldur-backend --glob '!Others/**'
# expect: no Services/ or Tests/ runtime hits (comments/docs ok if cleaned)
test -f cbaldur-backend/Others/cbaldur-json-to-nml   # still present
```

## Risky files

- `Services/PipelineExecutor.cs` — convert path is on critical JSON submit path.
- Number formatting helper — highest flake risk vs golden file.

## Rollback point

After step 5 fails repeatedly on formatting: keep converter behind a quick restore of `ExecuteConvert` binary call (YAML still has history in git). Binary file never deleted.

## Done when

All PRD acceptance criteria checked; unit tests green before any broader manual/E2E.

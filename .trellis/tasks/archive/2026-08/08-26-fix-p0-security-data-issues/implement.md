# Execution Plan: P0 Security & Data Integrity Fixes

## Checklist

### Phase 1: Planning & Context
- [x] Create Trellis task `08-26-fix-p0-security-data-issues`
- [x] Author `prd.md`, `design.md`, `implement.md`
- [x] Activate task via `python3 ./.trellis/scripts/task.py start`

### Phase 2: Implementation

#### Step 1: Fix Path Traversal in `CaseService.cs`
- [x] Refactor `GetFullPath` in `CaseService.cs` to enforce strict boundary checking with `StartsWith(basePath + Path.DirectorySeparatorChar)`.
- [x] Refactor `GetGFile`, `GetGfileTar`, `GetAllCsvTar`, `GetCaseFiles` to ensure all file paths use safe resolution.
- [x] Ensure `UnauthorizedAccessException` is thrown for path traversal attempts.

#### Step 2: Upgrade SSH.NET Dependency in `CBaldurBackendREST.csproj`
- [x] Update `SSH.NET` package version to `2026.0.0` in `cbaldur-backend/CBaldurBackendREST.csproj`.
- [x] Run `dotnet restore` and check `dotnet list package --vulnerable`.

#### Step 3: Remove Dangerous DDL in `Program.cs`
- [x] Remove `DROP TABLE ... CASCADE` DO blocks in `cbaldur-backend/Program.cs`.
- [x] Verify startup code initializes schemas cleanly without dropping tables.

#### Step 4: Unit Testing & Verification
- [x] Add unit tests in `CBaldurBackendREST.Tests` covering path traversal rejection and valid path resolution.
- [x] Run `dotnet build` and `dotnet test`.
- [x] Verify zero build warnings/errors and passing test suite.

### Phase 3: Finish & Review
- [x] Run quality check
- [x] Update spec / documentation if needed
- [ ] Update task status and record journal

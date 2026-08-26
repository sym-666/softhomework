# PRD: Fix P0 Security & Data Integrity Issues

## 1. Goal

Address and remediate the 3 critical P0 security and data integrity vulnerabilities identified in `IMPROVEMENTS.md` (excluding credential/secret management):
1. **Fix Path Traversal in Case File Operations** (`CaseService.cs`): Prevent arbitrary file read/write across the host system by strictly validating canonical paths against the case directory boundary.
2. **Upgrade Vulnerable Dependency SSH.NET** (`CBaldurBackendREST.csproj`): Mitigate GHSA-q939-rpr3-3284 (CVE-2026-48798) by updating to the latest secure version `2026.0.0`.
3. **Remove Dangerous Hardcoded DDL from Startup** (`Program.cs`): Remove `DROP TABLE ... CASCADE` execution during application startup to prevent accidental data loss in production environments.

---

## 2. Requirements & Scope

### 2.1 Path Traversal Prevention
- `CaseService.GetFullPath(Guid userId, Guid caseId, string relativePath)` must:
  - Reject null/empty/whitespace relative paths.
  - Resolve the canonical base path `Path.GetFullPath(Path.Combine(userDir, userId.ToString(), caseId.ToString()))`.
  - Resolve the canonical target path `Path.GetFullPath(Path.Combine(basePath, relativePath))`.
  - Enforce that `targetPath` starts with `basePath + Path.DirectorySeparatorChar` or equals `basePath`.
  - Throw `UnauthorizedAccessException` when a path escapes the sandbox.
- Ensure all file access methods (`GetFileContent`, `GetFileBytes`, `SaveFile`, `GetGFile`, `GetGfileTar`, `GetAllCsvTar`, `GetCaseFiles`) route through safe path resolution and boundary checks.

### 2.2 Dependency Security Upgrade
- Update package reference `SSH.NET` from vulnerable version `2025.1.0` to `2026.0.0` in `cbaldur-backend/CBaldurBackendREST.csproj`.
- Verify compilation with `dotnet build` and ensure no breaking changes in SSH usage across the project.
- Verify `dotnet list package --vulnerable` no longer reports `SSH.NET` vulnerability.

### 2.3 Dangerous Startup DDL Removal
- Eliminate the `DO $$ ... DROP TABLE IF EXISTS ... CASCADE ... END $$;` block in `Program.cs`.
- Preserve schema creation `CREATE SCHEMA IF NOT EXISTS auth;` and `CREATE SCHEMA IF NOT EXISTS cbaldur;`.
- Clean up legacy DDL comments and ensure backend boots cleanly without executing destructive DDL.

---

## 3. Acceptance Criteria

- [ ] Path traversal attacks (e.g. `../../../../etc/passwd`, `/etc/passwd`, `..\\..\\windows`) passed to `CaseService` methods are rejected with `UnauthorizedAccessException`.
- [ ] Valid relative paths within `{UserDir}/{userId}/{caseId}/` continue to work properly for file reading, saving, and downloading.
- [ ] `SSH.NET` is updated to `2026.0.0` in `CBaldurBackendREST.csproj`.
- [ ] `dotnet list package --vulnerable` shows 0 top-level vulnerabilities for `SSH.NET`.
- [ ] `Program.cs` no longer contains `DROP TABLE ... CASCADE` or destructive DDL scripts.
- [ ] `dotnet build` succeeds with zero errors.
- [ ] All unit tests pass (`dotnet test`).

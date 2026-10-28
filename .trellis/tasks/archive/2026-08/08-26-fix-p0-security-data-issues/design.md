# Design: P0 Security & Data Integrity Fixes

## 1. Context & Architecture Overview

The CBaldur backend exposes case data, configuration files, and calculation result plots. During architectural auditing (`IMPROVEMENTS.md`), 3 critical P0 items were identified in `cbaldur-backend`:
1. `CaseService` path resolution allows path traversal outside the user/case sandbox directory.
2. `SSH.NET` 2025.1.0 has a high-severity vulnerability (GHSA-q939-rpr3-3284) allowing arbitrary file write during SCP download operations.
3. `Program.cs` contains hardcoded `DROP TABLE ... CASCADE` DDL on startup.

---

## 2. Component Design & Changes

### 2.1 Safe Path Resolution in `CaseService`

#### Path Traversal Vulnerability Analysis
Currently, `GetFullPath` performs:
```csharp
var basePath = $"{_configuration["UserDir"]}/{userId}/{caseId}";
var fullPath = Path.GetFullPath(Path.Combine(basePath, relativePath));
return fullPath;
```
If `relativePath` is `../../../../etc/passwd` or `/etc/passwd`, `Path.Combine` and `Path.GetFullPath` navigate outside `basePath`.

#### Safe Implementation
```csharp
private string GetFullPath(Guid userId, Guid caseId, string relativePath)
{
    if (string.IsNullOrWhiteSpace(relativePath))
    {
        throw new ArgumentException("Path cannot be empty.", nameof(relativePath));
    }

    var userDir = _configuration["UserDir"] ?? "./data";
    var basePath = Path.GetFullPath(Path.Combine(userDir, userId.ToString(), caseId.ToString()));
    var targetPath = Path.GetFullPath(Path.Combine(basePath, relativePath));

    if (!targetPath.StartsWith(basePath + Path.DirectorySeparatorChar, StringComparison.Ordinal) && targetPath != basePath)
    {
        throw new UnauthorizedAccessException("非法路径访问：禁止超出案例工作目录范围。");
    }

    return targetPath;
}
```

Apply this safe resolution to:
- `GetFullPath`
- `GetGFile(Guid userId, Guid caseId, string time)`: normalize `time` to `gfile_{time.Replace('_', '.')}.dat` and resolve via `GetFullPath`.
- `GetGfileTar(Guid userId, Guid caseId)`: resolve `gfile.tar` via `GetFullPath`.
- `GetAllCsvTar(Guid userId, Guid caseId)`: resolve `all_csv.tar` via `GetFullPath`.
- `GetCaseFiles(Guid userId, Guid caseId)`: resolve directory path using `Path.GetFullPath(Path.Combine(userDir, userId.ToString(), caseId.ToString()))`.

### 2.2 Dependency Upgrade

Update package in `CBaldurBackendREST.csproj`:
```xml
<PackageReference Include="SSH.NET" Version="2026.0.0" />
```
Verify no API breaking changes in `ProcessProxy.cs` or `PipelineExecutor.cs`.

### 2.3 Dangerous Startup DDL Removal

Remove the `DO $$ ... DROP TABLE IF EXISTS ... CASCADE ... END $$;` block from `Program.cs`.
Keep schema creation:
```csharp
fsql.Ado.ExecuteNonQuery("CREATE SCHEMA IF NOT EXISTS auth");
fsql.Ado.ExecuteNonQuery("CREATE SCHEMA IF NOT EXISTS cbaldur");
```
And remove legacy dev table drop blocks.

---

## 3. Testing & Verification Strategy

- Add unit tests for `CaseService.GetFullPath` / file access ensuring path traversal (`..`, absolute paths, directory breakout) throws `UnauthorizedAccessException`.
- Build backend and run tests with `dotnet test`.
- Check package vulnerabilities with `dotnet list package --vulnerable`.

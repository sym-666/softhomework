# Implement: all PKs → UUID

## Order

1. `Program.cs`: wipe int-PK users/orgs/notices + cases (CASCADE-safe order)
2. Models: `User`/`Organization`/`Notice` Guid PK; FKs Guid; Case.UserId Guid
3. `ClaimsPrincipalExtensions` + `AuthService` JWT claims
4. Sweep backend: `int userId` / `organizationId` / notice id → Guid（Controllers + Services）
5. PipelineExecutor / CaseService paths already Guid case; ensure userId Guid.ToString()
6. Frontend RTK types + admin/cases/user routes
7. OpenAPI + `database-guidelines.md` + case-list contract `userId`
8. `dotnet build`; FE lint on touched files
9. Manual: register/login → Guid in JWT；建组织/通知/算例；目录 `{userUuid}/{caseUuid}`

## Validation

```bash
cd cbaldur-backend && dotnet build
cd cbaldur-frontend-next && npx tsc --noEmit  # expect only pre-existing noise
```

## Risk

- Missed `int` API param → 400/bind fail — grep `int userId|int organizationId|GetUserId`
- Old Cookie JWT — force re-login
- AutoSync without drop → startup fail — wipe must run first

## Rollback point

After step 1 data is gone; code revert only restores schema shape on next wipe/recreate.

# Design: parent integration

Parent owns no direct schema work. Children deliver independently.

Integration checks after both children complete:

1. Login → avatar URL loads
2. Create case → list shows caseId 1,2…；open via UUID route
3. Upload avatar does not break case APIs；case UUID change does not break user JSON

Rollback: revert each child independently.

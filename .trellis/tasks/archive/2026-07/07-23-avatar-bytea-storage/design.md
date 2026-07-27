# Design: avatar BYTEA storage

## Architecture

```
UploadAvatar (multipart)
  → validate type/size
  → read bytes + set AvatarContentType
  → UPDATE auth.users SET Avatar=BYTEA, AvatarContentType=...

GET /api/User/Avatar
  → auth cookie → load current user Avatar + ContentType
  → File(bytes, contentType) or 404

GetUser / Auth login JSON
  → avatar: has bytes ? "/api/User/Avatar" : null
  → never serialize byte[]

GitHub login
  → if Avatar empty: HTTP GET avatar_url → store bytes + content-type
```

## Data model

`auth.users`:

| Column | Type | Notes |
|--------|------|-------|
| `Avatar` | `bytea` nullable | was `text` |
| `AvatarContentType` | `varchar` nullable | e.g. `image/png` |

FreeSql: `byte[]? Avatar` with `[Column(DbType = "bytea")]`; add `AvatarContentType`.

If AutoSync cannot coerce text→bytea on existing rows: `UPDATE … SET "Avatar" = NULL` or drop column once in implement notes（开发库可接受）。

## API

- Keep `PUT/POST UploadAvatar` as today
- Add `GET /api/User/Avatar` `[Authorize]` — **current user only**（与现 UI 一致）
- Strip `Avatar` bytes from any `UserModel` JSON projection；map DTO `avatar` string URL
- AuthController login payload: same URL rule

## Frontend

- `User.avatar`: `string | null` URL
- `<img src={user.avatar}>` works if URL is same-origin + cookies：`<img>` **does not send** custom headers；Cookie auth **does** send for same-site images → OK for `/api/User/Avatar` with `credentials` cookie
- After upload: invalidate user query；optional `?v=updatedAt` cache bust if browser caches GET
- AvatarCropper `currentAvatar` continues to accept URL

## GitHub

- Reuse `IHttpClientFactory`；limit size (e.g. 2MB)；sniff Content-Type；on failure leave Avatar null（log warning）

## Rollback

- Revert columns to text + old Base64 upload path；GitHub URL string behavior

## Trade-offs

- img cookie auth depends on same-site Cookie — already used by API
- No public unauthenticated avatar URL — acceptable for current product

# 接口文档

本文档列出后端全部 45 个接口。后端运行时，可以在 `http://localhost:5168/docs` 查看 FastAPI 自动生成的 Swagger 文档，其中有完整的字段定义，并能直接调试。

## 1. 通用约定

| 项目 | 约定 |
| :--- | :--- |
| 基础路径 | `/api`。开发时前端通过 Rsbuild 代理访问，Docker 部署时由 nginx 转发 |
| 大小写 | `/api` 下的路径不区分大小写，中间件统一转为小写。前端沿用原项目写法，`/api/Auth/login` 与 `/api/auth/login` 等价 |
| 字段命名 | 请求和响应的 JSON 字段使用 camelCase，例如 `pageSize`、`createdAt` |
| 时间 | ISO 8601 格式的 UTC 时间，带时区标记 |
| 认证 | 登录后服务端设置 HttpOnly Cookie `AuthToken`（JWT，有效期 7 天），浏览器自动携带。除注册、登录、退出和健康检查外，所有接口都要求登录 |
| 用户隔离 | 访问别人的笔记、高亮、卡片时返回 404，而不是 403，不暴露数据是否存在 |
| 分页 | `page` 从 1 开始，响应为 `{ items, total, page, pageSize }` |

### 1.1 错误格式

所有错误的响应体都是：

```json
{ "success": false, "message": "论文不存在" }
```

| 状态码 | 含义 |
| :--- | :--- |
| 400 | 业务校验失败，例如文件不是 PDF、消息为空 |
| 401 | 未登录或登录已过期 |
| 403 | 不是上传者，不能删除或重新解析论文 |
| 404 | 资源不存在，或属于其他用户 |
| 409 | 状态冲突，例如论文还在解析中 |
| 411 / 413 | 上传缺少 `Content-Length` / 上传内容过大 |
| 422 | 参数格式错误，`message` 为“字段名: 原因” |
| 500 | 服务器内部错误，不返回细节 |
| 502 | 大模型调用失败或返回内容无法使用 |
| 503 | 大模型未配置，或 Semantic Scholar 暂时不可用 |

### 1.2 流式接口（SSE）

问答、对比和导读生成返回 `text/event-stream`。请求方式是 POST，前端用 `fetch` 读取响应流（浏览器的 `EventSource` 只支持 GET）。每个事件的格式为：

```text
event: delta
data: {"text": "这篇论文提出了"}

```

| 事件 | 数据 | 说明 |
| :--- | :--- | :--- |
| `citations` | `[{ "page": 3, "snippet": "..." }]` | 只有问答和对比发送，在回答之前发出，是检索到的候选来源。对比中每项另有 `paperId`、`label`（如 `P1`）、`title` |
| `delta` | `{ "text": "..." }` | 回答的一个片段，前端依次拼接 |
| `error` | `{ "message": "..." }` | 生成过程中出错，例如模型不可用或回答被截断 |
| `done` | `{}` | 结束，无论成功与否都会发送 |

参数校验、论文状态检查都在开始输出之前完成，这些错误以普通 JSON 返回（见 1.1）。响应头带 `Cache-Control: no-cache, no-store` 和 `X-Accel-Buffering: no`，避免代理缓冲。

回答中的来源标注格式为 `[p.3]`，对比回答为 `[P2 p.5]`。前端只把回答中实际出现、且在 `citations` 候选中的页显示为可点击的来源。

## 2. 认证与用户

| 方法 | 路径 | 说明 | 请求 | 成功响应 | 主要错误 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | 注册 | `{ username, email, password }`：用户名 3–50 字符，密码 8–128 字符 | `{ success: true, message }` | 400 用户名或邮箱已被注册；422 格式错误 |
| POST | `/api/auth/login` | 登录，设置 Cookie | `{ usernameOrEmail, password }` | `{ success: true, user: UserOut }` | 401 用户名或密码错误 |
| POST | `/api/auth/logout` | 退出，清除 Cookie | — | `{ success: true, message }` | — |
| GET | `/api/auth/validate` | 检查登录状态 | — | `{ valid: true }` | 401 |
| GET | `/api/user/getuser` | 当前用户信息 | — | `UserOut` | 401 |

`UserOut`：`{ id, username, email, roleId, avatar }`，`avatar` 固定为 `null`，响应中不包含密码哈希。

## 3. 论文库

| 方法 | 路径 | 说明 | 请求 | 成功响应 | 主要错误 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/api/papers` | 论文列表，最新的在前 | 查询：`search`（匹配标题、作者、标签、摘要，不区分大小写）、`page`、`pageSize`（默认 24，最大 50） | `PaperPage` | — |
| POST | `/api/papers` | 上传论文 | `multipart/form-data`：`Title`、`Authors`、`Year` 必填；`Abstract`、`Tags`（逗号分隔）、`Url`、`File` 选填，`File` 和 `Url` 至少一项 | 201 `PaperOut` | 400 字段不合法、不是 PDF、超过 20 MB；411 / 413 |
| GET | `/api/papers/{id}` | 论文详情，解析期间前端轮询它 | — | `PaperOut` | 404 |
| DELETE | `/api/papers/{id}` | 删除论文及其文件和所有关联数据 | — | 204 | 403 不是上传者；404 |
| GET | `/api/papers/{id}/download` | 获取 PDF | — | 有本地文件时返回 PDF（inline，支持 Range）；外链论文 302 跳转到原网址 | 404 文件和链接都不可用 |
| POST | `/api/papers/{id}/ingest` | 重新解析 | — | 202 `PaperOut`，状态为 `pending` | 400 没有本地 PDF；403 不是上传者；409 正在解析 |
| GET | `/api/papers/search` | 检索 Semantic Scholar | 查询：`query`（必填，最长 300）、`limit`（默认 12，最大 50） | `{ query, totalCount, papers: GlobalPaperOut[] }` | 400 关键词为空；503 检索服务不可用 |
| GET | `/api/papers/{id}/references` | 从 PDF 解析参考文献 | — | `[{ index, text, title, year }]`；外链论文或无法解析时为空数组 | 404 |
| GET | `/api/papers/bibtex` | 导出整个论文库的 BibTeX | — | `paperpilot-library.bib` 附件 | — |
| GET | `/api/papers/{id}/bibtex` | 导出单篇 BibTeX | — | `paper-{id}.bib` 附件 | 404 |

`PaperOut` 字段：

| 字段 | 说明 |
| :--- | :--- |
| `id`、`title`、`authors`、`year`、`abstract` | 基本信息 |
| `tags` | 字符串数组 |
| `sourceUrl` | 外链地址，可能为 `null` |
| `downloadUrl` | `/api/Papers/{id}/download` |
| `hasLocalFile` | 是否上传了 PDF |
| `ingestStatus` | `none` / `pending` / `processing` / `ready` / `no_text` / `failed`，含义见[数据库设计](03-database.md#32-papers-论文) |
| `createdByUserId`、`createdByUserName`、`createdAt` | 上传者和上传时间 |

`GlobalPaperOut`（在线检索结果）：`{ id, title, authors, year, abstract, url, pdfUrl }`，其中 `id` 是 Semantic Scholar 的论文编号。前端把结果加入论文库时，以 `pdfUrl` 或 `url` 作为外链调用 `POST /api/papers`，服务端不下载 PDF。

## 4. 阅读进度

| 方法 | 路径 | 说明 | 请求 | 成功响应 | 主要错误 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/api/papers/{id}/reading-state` | 当前用户的阅读进度，没有记录时返回未读、第 1 页 | — | `{ status, lastPage, updatedAt }` | 404 论文不存在 |
| PUT | `/api/papers/{id}/reading-state` | 更新进度 | `{ status?, lastPage? }`，两项都可选 | 同上 | 404；422 |

规则：只传 `lastPage` 时，未读的论文自动变为在读，已读的论文保持已读；同时传 `status` 时以 `status` 为准。前端翻页后 800 毫秒保存一次，离开页面时立即保存。

## 5. 笔记

| 方法 | 路径 | 说明 | 请求 | 成功响应 | 主要错误 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/api/papers/{id}/notes` | 某篇论文的笔记，最新的在前 | — | `NoteOut[]` | — |
| POST | `/api/papers/{id}/notes` | 新建笔记 | `{ content, page? }`：内容去掉首尾空白后 1–10000 字符 | 201 `NoteOut` | 404 论文不存在；422 |
| PUT | `/api/notes/{noteId}` | 修改笔记 | 同上 | `NoteOut` | 404 |
| DELETE | `/api/notes/{noteId}` | 删除笔记，关联的高亮保留 | — | 204 | 404 |
| GET | `/api/notes` | 我的全部笔记，按修改时间倒序 | 查询：`search`、`paperId`、`page`、`pageSize`（默认 20，最大 50） | `NotePage` | — |
| GET | `/api/notes/summary` | 笔记统计 | — | `{ total, recent, highlights, papers: [{ paperId, title, count }] }`，`recent` 为近 7 天新增 | — |
| GET | `/api/notes/export` | 导出 Markdown，按论文和页码排列 | 查询：`paperId`（可选）、`lang`（`zh-CN` / `en`，决定标题文字） | `paperpilot-notes.md` 或 `paper-{id}-notes.md` 附件 | 422 语言不支持 |

`NoteOut`：`{ id, paperId, paperTitle, page, content, createdAt, updatedAt }`。

## 6. 高亮

| 方法 | 路径 | 说明 | 请求 | 成功响应 | 主要错误 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| GET | `/api/papers/{id}/highlights` | 某篇论文的高亮，按页排序 | — | `HighlightOut[]` | — |
| POST | `/api/papers/{id}/highlights` | 新建高亮 | `{ page, color, text, rects }` | 201 `HighlightOut` | 404 论文不存在；422 |
| PATCH | `/api/highlights/{highlightId}` | 改颜色，或关联 / 解除笔记 | `{ color?, noteId? }`：不传 `noteId` 表示不修改，传 `null` 表示解除关联 | `HighlightOut` | 404 高亮不存在，或笔记不属于本人、不属于同一篇论文 |
| DELETE | `/api/highlights/{highlightId}` | 删除高亮，关联的笔记保留 | — | 204 | 404 |

- `color`：`yellow` / `green` / `pink`
- `text`：最长 5000 字符
- `rects`：`[{ x, y, width, height }]`，均为相对页面宽高的比例，取值 0–1

`HighlightOut`：`{ id, paperId, page, color, text, rects, noteId, createdAt }`。

## 7. 学习卡片与复习

| 方法 | 路径 | 说明 | 请求 | 成功响应 | 主要错误 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| POST | `/api/ai/studycards` | 用 AI 生成 5 道选择题和 5 张闪卡，跳过已有题目 | 查询：`id`、`lang` | 201 本次新增的 `StudyCardOut[]` | 409 同时生成冲突；502 模型失败或结果不可用；503 未配置；以及 AI 通用错误（见第 9 节） |
| GET | `/api/papers/{id}/study-cards` | 某篇论文的全部卡片 | — | `StudyCardOut[]` | — |
| GET | `/api/study-cards/due` | 已到期的卡片，按到期时间排序 | 查询：`limit`（默认和最大都是 50）、`paperId`（可选） | `{ items: StudyCardOut[], total }` | — |
| POST | `/api/study-cards/{cardId}/review` | 记录一次复习结果 | `{ correct: boolean }` | 更新后的 `StudyCardOut` | 404 |
| DELETE | `/api/study-cards/{cardId}` | 删除卡片 | — | 204 | 404 |
| GET | `/api/study-cards/summary` | 复习进度 | 查询：`tzOffset`（与 JS `getTimezoneOffset()` 相同，单位分钟，-840 到 840） | `{ total, due, mastered, nextDueAt, forecast: [{ date, count }], papers: [{ paperId, title, total, due, mastered }] }` | 422 |

`StudyCardOut`：`{ id, paperId, paperTitle, kind, question, options, answer, explanation, page, box, dueAt }`。`kind` 为 `quiz` 或 `flashcard`，闪卡的 `options` 为空数组。

复习规则：答对时 `box` 加一，按 1、3、7、14、30 天推迟（之后保持 30 天）；答错时 `box` 归零并立即到期。`forecast` 覆盖从今天起 7 天，过期未复习的卡片计入今天。

## 8. 学习看板

| 方法 | 路径 | 说明 | 请求 | 成功响应 |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/dashboard` | 看板数据 | 查询：`tzOffset` | 见下 |

响应：

```json
{
  "totalPapers": 12,
  "reading": 3,
  "done": 2,
  "notes": 18,
  "dueCards": 5,
  "activity": [{ "date": "2026-11-01", "papers": 2, "notes": 4 }],
  "continueReading": [{ "paperId": 7, "title": "...", "authors": "...", "lastPage": 5 }]
}
```

`activity` 固定 14 天。`papers` 按每篇论文最后一次更新阅读进度的日期计数：阅读状态每篇论文只有一条记录，一篇论文连续几天都读，只算在最后一天。`notes` 是当天新增的笔记数。`continueReading` 最多 5 篇在读论文，按最近阅读排序。

## 9. AI

以下接口的 `id` 是论文编号，`lang` 为 `zh-CN` 或 `en`。

| 方法 | 路径 | 说明 | 请求 | 成功响应 |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/ai/status` | 是否已配置大模型 | — | `{ enabled: boolean }` |
| POST | `/api/ai/paperchat?id=` | 单篇论文问答 | `{ message, history?, page? }` | SSE |
| GET | `/api/ai/paperchat/history?id=` | 对话记录，最近 200 条，按时间正序 | — | `[{ id, role, content, citations, createdAt }]` |
| DELETE | `/api/ai/paperchat/history?id=` | 清空本人在这篇论文上的对话 | — | 204 |
| POST | `/api/ai/compare` | 多论文对比问答 | `{ paperIds, message, history? }`，`paperIds` 2–4 个，去重后至少 2 个 | SSE |
| GET | `/api/ai/paperguide?id=&lang=` | 读取导读缓存，没有时返回 `null`；未配置大模型也能读取 | — | `{ content, model, createdAt }` 或 `null` |
| POST | `/api/ai/paperguide?id=&lang=` | 生成导读，完整结束后覆盖缓存 | — | SSE |
| GET | `/api/ai/paperglossary?id=&lang=` | 读取术语表缓存 | — | `{ terms: [{ term, explanation, page }], model, createdAt }` 或 `null` |
| POST | `/api/ai/paperglossary?id=&lang=` | 生成术语表，成功后覆盖缓存 | — | 201 同上 |
| POST | `/api/ai/studycards?id=&lang=` | 生成学习卡片 | — | 见第 7 节 |

问答请求体：

| 字段 | 说明 |
| :--- | :--- |
| `message` | 问题，1–2000 字符，不能只有空白 |
| `history` | 之前的对话 `[{ role: "user" \| "assistant", content }]`，最多 12 条，每条最长 2 万字符，发给模型前截断到 4000 字符 |
| `page` | 用户正在读的页（≥ 1），划词提问时前端会带上，这一页最相关的段落一定会放进上下文 |

调用模型的接口在开始前统一检查：

| 状态码 | 原因 |
| :--- | :--- |
| 503 | 大模型未配置 |
| 404 | 论文不存在 |
| 409 | 论文还在解析中 |
| 400 | 没有全文也没有摘要 |

## 10. 其他

| 方法 | 路径 | 说明 | 成功响应 |
| :--- | :--- | :--- | :--- |
| GET | `/api/health` | 健康检查，不需要登录 | `{ status: "ok" }` |

# 概要设计

## 1. 设计目标

- 阅读、提问、记笔记在同一个页面完成，AI 回答能追溯到原文页码。
- 部署简单：单机即可运行，不依赖独立的数据库服务和向量数据库。
- AI 服务可替换：任何 OpenAI 兼容接口都能接入，未配置时站点照常运行。
- 个人数据按用户隔离，论文和 AI 生成的公共内容全站共享。

## 2. 系统架构

系统采用前后端分离的三层结构：浏览器中的单页应用、FastAPI 接口服务、SQLite 数据库和本地文件存储。大模型和 Semantic Scholar 是外部服务。

```mermaid
flowchart TB
    subgraph Browser[浏览器]
        UI[React 单页应用<br/>Ribbon 界面 · react-pdf · ECharts]
        Store[Redux Toolkit<br/>RTK Query 缓存]
        Stream[SSE 读取<br/>useAiChatStream / useGuideStream]
        UI --> Store
        UI --> Stream
    end

    subgraph Server[后端 FastAPI]
        MW[中间件<br/>路径转小写 · 上传大小限制]
        Routers[路由层 app/routers<br/>认证 · 论文 · 阅读 · 笔记 · 高亮 · 复习 · 看板 · AI]
        Services[服务层 app/services<br/>PDF 提取 · 切块 · 检索 · 问答 · 导读 · 术语表 · 卡片 · 对比 · 参考文献 · 导出]
        BG[后台任务<br/>全文解析]
        MW --> Routers --> Services
        Routers --> BG --> Services
    end

    DB[(SQLite<br/>data/app.db)]
    Files[(PDF 文件<br/>data/papers/)]
    LLM[[OpenAI 兼容大模型<br/>默认 DeepSeek]]
    S2[[Semantic Scholar API]]

    Store -- REST / JSON --> MW
    Stream -- POST + SSE --> MW
    Services --> DB
    Services --> Files
    Services --> LLM
    Services --> S2
```

### 2.1 分层职责

| 层 | 位置 | 职责 |
| :--- | :--- | :--- |
| 表现层 | `cbaldur-frontend/src/routes`、`components` | 页面和交互，Ribbon 外壳沿用 cbaldur |
| 前端状态 | `src/redux`、`src/hooks` | RTK Query 管理接口缓存和失效；自定义 Hook 处理流式回答、阅读页码保存和划词 |
| 接口层 | `paper-backend/app/routers` | 参数校验、身份认证、权限和用户隔离，返回 camelCase JSON |
| 业务层 | `paper-backend/app/services` | 与 HTTP 无关的业务逻辑，可以单独测试 |
| 数据层 | `app/models.py`、`alembic/` | SQLAlchemy 模型和迁移 |
| 基础设施 | `app/config.py`、`app/db.py`、`app/security.py`、`app/middleware.py`、`app/errors.py` | 配置、数据库连接、密码和 JWT、中间件、统一错误格式 |

## 3. 技术选型

| 需求 | 选择 | 理由 |
| :--- | :--- | :--- |
| 界面框架 | 沿用 cbaldur 前端（React 19、TypeScript、Tailwind CSS 4、shadcn/ui） | 已有完整的 Ribbon 布局、国际化和登录页，只需替换业务模块 |
| 前端状态 | Redux Toolkit + RTK Query | 原项目已在使用；接口缓存按标签失效，保存笔记后列表自动刷新 |
| PDF 渲染 | react-pdf（pdf.js） | 提供文本层，支持划词和高亮定位 |
| 后端框架 | FastAPI | 类型注解即校验规则，自动生成 OpenAPI；原生支持流式响应 |
| 数据库 | SQLite + SQLAlchemy 2 + Alembic | 无需单独部署；开启 WAL 和外键约束；迁移可追溯 |
| PDF 提取 | PyMuPDF | 按页提取文字，速度快，能识别加密和损坏的文件 |
| 检索 | rank-bm25 | 单篇论文切块少，关键词检索足够；不需要 embedding 接口（默认的 DeepSeek 没有提供） |
| 大模型 | openai SDK 调用 OpenAI 兼容接口 | 可以切换 DeepSeek、OpenAI 或本地模型，只改环境变量 |
| 认证 | JWT（HS256）+ HttpOnly Cookie，argon2 哈希 | 前端脚本读不到令牌；沿用原前端的 `AuthToken` Cookie 约定 |
| 部署 | Docker Compose：nginx 托管前端并反向代理 `/api` | 两个容器即可运行 |

## 4. 模块划分

### 4.1 后端模块

| 模块 | 路由 | 服务 | 说明 |
| :--- | :--- | :--- | :--- |
| 认证 | `auth.py`、`users.py` | `security.py` | 注册、登录、退出、校验登录、个人信息 |
| 论文库 | `papers.py` | `storage.py`、`semantic_scholar.py`、`export.py`、`references.py` | 增删查、上传下载、在线检索、BibTeX、参考文献 |
| 全文解析 | `papers.py`（重试） | `ingestion.py`、`pdf_text.py`、`chunking.py` | 后台提取文字、切块、状态流转 |
| 阅读进度 | `reading.py` | — | 阅读状态和上次页码 |
| 笔记 | `notes.py` | `export.py` | 笔记增删改查、统计、Markdown 导出 |
| 高亮 | `highlights.py` | — | 高亮增删改，关联笔记 |
| 学习卡片 | `study.py`、`ai.py`（生成） | `study_cards.py` | 生成、复习调度、进度统计 |
| 看板 | `dashboard.py` | — | 统计和最近活动 |
| AI | `ai.py` | `llm.py`、`llm_json.py`、`retrieval.py`、`paper_chat.py`、`paper_guide.py`、`paper_glossary.py`、`paper_compare.py` | 问答、对话记录、导读、术语表、对比 |

### 4.2 前端模块

| 页面 | 路由 | 主要组件 |
| :--- | :--- | :--- |
| 登录 / 注册 | `/auth/sign-in`、`/auth/sign-up` | `routes/auth` |
| 学习看板 | `/` | `StatCard`、`ActivityChart` |
| 论文库 | `/papers` | 上传对话框、在线检索、`useSaveGlobalPaper` |
| 论文详情 | `/papers/:id` | 左侧 `PdfReader`、`HighlightLayer`、`SelectionToolbar`；右侧标签页：问答 `PaperAssistant`、导读 `PaperGuide`、笔记 `NotesPanel`、自测 `StudyPanel`、术语 `PaperGlossary`、参考文献 `ReferencesPanel`、信息 |
| 我的笔记 | `/notes` | `NoteItem`、`HighlightItem`、`ExportLink` |
| 复习 | `/review` | `StudySession`、未来 7 天到期分布 |
| 对比 | `/compare` | 论文选择、`AiChatPanel` |
| 个人中心 | `/user` | 个人信息 |

界面语言在底部状态栏 `StatusBar` 中切换，保存在 Redux 的 `localeSlice`；退出登录在 Ribbon 布局 `RibbonLayout` 中。

## 5. 部署结构

```mermaid
flowchart LR
    Browser[浏览器] -->|HTTP :3000| Nginx

    subgraph Docker Compose
        Nginx[frontend 容器<br/>nginx 托管静态文件]
        API[backend 容器<br/>uvicorn + FastAPI :8000]
        Vol[(数据卷 paper-data<br/>app.db + PDF)]
        Nginx -->|/api/ 反向代理<br/>关闭缓冲以支持 SSE| API
        API --> Vol
    end

    API -->|HTTPS| LLM[[大模型服务]]
    API -->|HTTPS| S2[[Semantic Scholar]]
```

- nginx 对 `/api/` 关闭 `proxy_buffering`，读超时 1 小时，保证流式回答逐字到达浏览器；上传上限 22 MB（PDF 20 MB 加表单余量）。
- 后端通过环境变量配置，`JWT_KEY` 未设置时 Compose 直接报错。
- 本地开发时 Rsbuild 开发服务器把 `/api` 代理到 `localhost:5168`。

> Docker 部署配置已编写并通过 `docker compose config` 校验，但还没有实际构建运行过，见[测试报告](06-test-report.md#7-未验证事项)。

## 6. 关键流程

### 6.1 上传与全文解析

```mermaid
sequenceDiagram
    actor U as 用户
    participant FE as 前端
    participant API as papers 路由
    participant BG as 后台任务 ingestion
    participant DB as SQLite
    participant FS as 文件存储

    U->>FE: 填写信息并选择 PDF
    FE->>API: POST /api/papers（multipart）
    API->>API: 校验字段、扩展名、类型、%PDF- 文件头、20 MB
    API->>FS: 以随机文件名保存
    API->>DB: 插入论文，ingest_status = pending
    API-->>FE: 201 论文信息
    API->>BG: 加入后台任务
    BG->>DB: 状态改为 processing
    BG->>FS: PyMuPDF 按页提取文字
    alt 文字足够
        BG->>DB: 写入切块，状态 ready
    else 不足 100 字符（扫描版）
        BG->>DB: 状态 no_text
    else 损坏、加密或异常
        BG->>DB: 清空切块，状态 failed
    end
    loop 状态为 pending / processing 时
        FE->>API: GET /api/papers/{id}
    end
```

服务重启时，`lifespan` 会找出仍处于 `pending`、`processing` 的论文重新解析，因为 FastAPI 的后台任务只存在于进程内存中。

### 6.2 全文问答

```mermaid
sequenceDiagram
    actor U as 用户
    participant FE as 问答面板
    participant API as ai 路由
    participant SVC as paper_chat
    participant LLM as 大模型
    participant DB as SQLite

    U->>FE: 输入问题（划词时附带当前页码）
    FE->>API: POST /api/ai/paperchat?id=论文
    API->>API: 校验：已配置、论文存在、不在解析中、有内容
    API-->>FE: 200 text/event-stream
    SVC->>SVC: 拼接上一个问题，支持追问
    opt 中文问题、英文论文
        SVC->>LLM: 改写成英文关键词
        LLM-->>SVC: 关键词（不可用时退回原问题）
    end
    SVC->>SVC: BM25 取 6 段，补入当前页最相关的 3 段
    SVC-->>FE: event: citations（候选来源页）
    SVC->>LLM: 系统提示 + 历史 + <paper_context> + 问题
    loop 流式输出
        LLM-->>SVC: 文本片段
        SVC-->>FE: event: delta
    end
    alt 完整结束
        SVC->>DB: 保存问题、回答和引用
    else 失败或被截断
        SVC-->>FE: event: error
    end
    SVC-->>FE: event: done
    FE->>FE: 只显示回答中实际引用、且在候选内的页
```

所有校验在开始流式输出之前完成，失败时返回普通 JSON 错误，前端可以读取 `message` 显示原因。

### 6.3 导读生成与缓存

```mermaid
sequenceDiagram
    actor U as 用户
    participant FE as 导读面板
    participant API as ai 路由
    participant LLM as 大模型
    participant DB as SQLite

    FE->>API: GET /api/ai/paperguide?id&lang
    alt 已有缓存
        API-->>FE: 导读内容
    else 没有缓存
        API-->>FE: null
        U->>FE: 点击生成
        FE->>API: POST /api/ai/paperguide?id&lang
        API->>API: 全文超过 4 万字符时均匀取样
        API->>LLM: 按语言的小节模板
        loop 流式输出
            LLM-->>FE: event: delta
        end
        API->>DB: 完整结束才写入 paper_guides
        API-->>FE: event: done
    end
```

术语表和学习卡片使用非流式的 JSON 输出，流程类似：调用模型，逐条校验结果，再保存。

### 6.4 间隔复习

```mermaid
stateDiagram-v2
    [*] --> 待复习: 生成卡片（box = 0，立即到期）
    待复习 --> 等待中: 答对（box + 1，按 1/3/7/14/30 天推迟）
    待复习 --> 待复习: 答错（box = 0）
    等待中 --> 待复习: 到期
    等待中 --> 已掌握: box ≥ 3
    已掌握 --> 待复习: 到期
```

“已掌握”是统计口径，不是单独的状态字段：box 达到 3 的卡片仍会按间隔到期复习，答错后 box 归零。

## 7. 横切设计

### 7.1 安全

| 风险 | 措施 |
| :--- | :--- |
| 令牌被脚本窃取 | JWT 放在 HttpOnly Cookie 中，SameSite=Lax；生产环境可开启 `COOKIE_SECURE` |
| 弱密钥 | `JWT_KEY` 至少 32 字符，没有默认值，缺失时启动失败 |
| 账号枚举 | 登录失败统一返回“用户名或密码错误”；用户不存在时也做一次哈希校验 |
| 越权访问 | 个人数据查询都带 `user_id` 条件，查不到时返回 404，不暴露数据是否存在 |
| 恶意上传 | 中间件按 `Content-Length` 提前拒绝超大请求；路由校验扩展名、类型和文件头；随机文件名存储 |
| SSRF | 外链论文只保存网址，下载时重定向，服务端不发起请求 |
| 提示词注入 | 论文内容放在 `<paper_context>` 标签中，提示词声明其为数据；论文文本中的同名标签被移除，无法提前闭合 |
| 模型编造页码 | 来源页只能来自检索结果；术语页码由服务端在全文中查找；卡片页码必须在上下文中出现 |

### 7.2 错误处理

- 所有错误响应格式统一为 `{"success": false, "message": "..."}`，校验错误给出字段名，未知异常只返回“服务器内部错误”并记录日志。
- 流式接口在响应开始后出错时，发送 `error` 事件，再发送 `done` 事件结束。

### 7.3 数据共享与隔离

| 全站共享 | 按用户隔离 |
| :--- | :--- |
| 论文、PDF、切块、导读、术语表 | 阅读状态、笔记、高亮、对话记录、学习卡片 |

论文由上传者管理，其他用户只能阅读；删除论文时数据库外键级联删除所有关联数据。

### 7.4 国际化

前端使用 react-intl，文案放在 `src/i18n/messages/zh-CN.ts` 和 `en.ts`。导读、术语表、学习卡片的生成请求带上 `lang`，按语言分别缓存。
